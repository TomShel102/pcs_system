import { runTransaction } from '../db.js';
import { createAppError, sendError, sendSuccess } from '../utils/http.js';
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  rollbackIdempotentRequest
} from '../utils/idempotency.js';
import { logInfo } from '../utils/logger.js';
import { normalizeLicensePlate, normalizeVehicleType, requireFields } from '../utils/validation.js';

export const checkIn = async (req, res) => {
  const endpoint = 'POST:/api/check-in';
  const idempotencyKey = String(req.headers['idempotency-key'] || '').trim();
  let idempotencyRecordId = null;
  try {
    const idempotencyState = await beginIdempotentRequest(endpoint, idempotencyKey);
    if (idempotencyState.mode === 'replay') {
      return res.status(idempotencyState.statusCode).json(idempotencyState.payload);
    }
    if (idempotencyState.mode === 'in_progress') {
      throw createAppError(409, 'Yêu cầu đang được xử lý, vui lòng thử lại sau');
    }
    idempotencyRecordId = idempotencyState.recordId;

    requireFields(req.body, ['license_plate', 'vehicle_type', 'guard_in_id']);
    const licensePlate = normalizeLicensePlate(req.body.license_plate);
    const vehicleType = normalizeVehicleType(req.body.vehicle_type);
    const guardInId = String(req.body.guard_in_id).trim();

    const result = await runTransaction(async (client) => {
      const guardResult = await client.query(
        `SELECT id
         FROM users
         WHERE id = $1
           AND is_deleted = FALSE
         LIMIT 1`,
        [guardInId]
      );
      if (guardResult.rows.length === 0) {
        throw createAppError(400, 'Mã nhân viên vào bãi không hợp lệ');
      }

      // 1. Get or create vehicle
      let vehicleResult = await client.query(
        'SELECT id, vehicle_type FROM vehicles WHERE license_plate = $1 AND is_deleted = false',
        [licensePlate]
      );

      let vehicle_id;
      if (vehicleResult.rows.length === 0) {
        const insertVehicle = await client.query(
          'INSERT INTO vehicles (license_plate, vehicle_type, is_deleted) VALUES ($1, $2, false) RETURNING id',
          [licensePlate, vehicleType]
        );
        vehicle_id = insertVehicle.rows[0].id;
      } else {
        vehicle_id = vehicleResult.rows[0].id;
        if (vehicleResult.rows[0].vehicle_type !== vehicleType) {
          await client.query(
            'UPDATE vehicles SET vehicle_type = $1 WHERE id = $2',
            [vehicleType, vehicle_id]
          );
        }
      }

      // 2. Check if vehicle is already in parking lot
      const activeSession = await client.query(
        'SELECT id FROM parking_sessions WHERE vehicle_id = $1 AND time_out IS NULL AND is_deleted = false LIMIT 1',
        [vehicle_id]
      );

      if (activeSession.rows.length > 0) {
        throw createAppError(409, 'Xe đang trong bãi');
      }

      // 3. Check for valid monthly ticket
      const ticketResult = await client.query(
        'SELECT id FROM monthly_tickets WHERE vehicle_id = $1 AND expiration_date >= CURRENT_DATE AND is_deleted = false LIMIT 1',
        [vehicle_id]
      );

      const monthly_ticket_id = ticketResult.rows.length > 0 ? ticketResult.rows[0].id : null;

      // 4. Pick available slot by vehicle type
      const slotResult = await client.query(
        `SELECT id, slot_code
         FROM parking_slots
         WHERE is_deleted = FALSE
           AND is_active = TRUE
           AND status = 'FREE'
           AND (supported_vehicle_type IS NULL OR supported_vehicle_type = $1)
         ORDER BY slot_code
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [vehicleType]
      );
      if (slotResult.rows.length === 0) {
        throw createAppError(409, 'Bãi đã hết chỗ trống phù hợp cho loại xe này');
      }
      const selectedSlot = slotResult.rows[0];
      const reserveSlotResult = await client.query(
        `UPDATE parking_slots
         SET status = 'OCCUPIED'
         WHERE id = $1
           AND status = 'FREE'
           AND is_deleted = FALSE
           AND is_active = TRUE`,
        [selectedSlot.id]
      );
      if (reserveSlotResult.rowCount === 0) {
        throw createAppError(409, 'Chỗ đỗ vừa được chiếm, vui lòng thử lại');
      }

      // 5. Insert parking session
      let sessionResult;
      try {
        sessionResult = await client.query(
          'INSERT INTO parking_sessions (vehicle_id, guard_in_id, monthly_ticket_id, slot_id, is_deleted) VALUES ($1, $2, $3, $4, false) RETURNING id, time_in',
          [vehicle_id, guardInId, monthly_ticket_id, selectedSlot.id]
        );
      } catch (error) {
        if (error?.code === '23505') {
          throw createAppError(409, 'Xe đang trong bãi');
        }
        if (error?.code === '23503') {
          throw createAppError(400, 'Thông tin tham chiếu không hợp lệ (guard hoặc vị trí đỗ)');
        }
        throw error;
      }

      return {
        sessionId: sessionResult.rows[0].id,
        vehicleId: vehicle_id,
        timeIn: sessionResult.rows[0].time_in,
        monthlyTicketId: monthly_ticket_id,
        slotCode: selectedSlot.slot_code
      };
    });

    const payload = {
      data: result
    };
    await completeIdempotentRequest(idempotencyRecordId, 201, { success: true, ...payload });
    logInfo('parking.check_in.success', {
      license_plate: licensePlate,
      session_id: result.sessionId,
      guard_in_id: guardInId
    });
    return sendSuccess(res, 201, payload);
  } catch (error) {
    await rollbackIdempotentRequest(idempotencyRecordId);
    return sendError(res, error);
  }
};

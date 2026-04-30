import { runTransaction } from '../db.js';
import { createAppError, sendError, sendSuccess } from '../utils/http.js';
import { normalizeLicensePlate, normalizeVehicleType, requireFields } from '../utils/validation.js';

export const setSlotMaintenance = async (req, res) => {
  try {
    requireFields(req.body, ['is_maintenance']);
    const slotCode = String(req.params.slot_code || '').trim().toUpperCase();
    if (!slotCode) {
      throw createAppError(400, 'Thiếu mã slot cần cập nhật');
    }
    const isMaintenance = Boolean(req.body.is_maintenance);

    const result = await runTransaction(async (client) => {
      const slotResult = await client.query(
        `SELECT id, slot_code, status
         FROM parking_slots
         WHERE slot_code = $1
           AND is_deleted = FALSE
           AND is_active = TRUE
         LIMIT 1
         FOR UPDATE`,
        [slotCode]
      );
      if (slotResult.rows.length === 0) {
        throw createAppError(404, 'Không tìm thấy slot theo mã đã cung cấp');
      }

      const slot = slotResult.rows[0];
      if (isMaintenance && slot.status === 'OCCUPIED') {
        throw createAppError(409, 'Không thể chuyển bảo trì vì slot đang có xe');
      }
      if (!isMaintenance && slot.status === 'OCCUPIED') {
        throw createAppError(409, 'Không thể mở slot vì slot đang có xe');
      }

      const nextStatus = isMaintenance ? 'MAINTENANCE' : 'FREE';
      const updateResult = await client.query(
        `UPDATE parking_slots
         SET status = $1
         WHERE id = $2
         RETURNING slot_code, status`,
        [nextStatus, slot.id]
      );
      return updateResult.rows[0];
    });

    return sendSuccess(res, 200, { data: result });
  } catch (error) {
    return sendError(res, error);
  }
};

export const transferActiveSessionSlot = async (req, res) => {
  try {
    requireFields(req.body, ['license_plate', 'target_slot_code']);
    const licensePlate = normalizeLicensePlate(req.body.license_plate);
    const targetSlotCode = String(req.body.target_slot_code || '').trim().toUpperCase();
    if (!targetSlotCode) {
      throw createAppError(400, 'Thiếu mã slot đích');
    }

    const result = await runTransaction(async (client) => {
      const sessionResult = await client.query(
        `SELECT
          ps.id,
          ps.slot_id,
          v.vehicle_type
        FROM parking_sessions ps
        JOIN vehicles v ON v.id = ps.vehicle_id
        WHERE v.license_plate = $1
          AND ps.time_out IS NULL
          AND ps.is_deleted = FALSE
          AND v.is_deleted = FALSE
        LIMIT 1
        FOR UPDATE OF ps`,
        [licensePlate]
      );
      if (sessionResult.rows.length === 0) {
        throw createAppError(404, 'Không tìm thấy phiên gửi xe đang hoạt động để điều chuyển');
      }
      const session = sessionResult.rows[0];
      const vehicleType = normalizeVehicleType(session.vehicle_type);

      const targetSlotResult = await client.query(
        `SELECT id, slot_code, status, supported_vehicle_type
         FROM parking_slots
         WHERE slot_code = $1
           AND is_deleted = FALSE
           AND is_active = TRUE
         LIMIT 1
         FOR UPDATE`,
        [targetSlotCode]
      );
      if (targetSlotResult.rows.length === 0) {
        throw createAppError(404, 'Không tìm thấy slot đích');
      }
      const targetSlot = targetSlotResult.rows[0];
      if (session.slot_id && String(session.slot_id) === String(targetSlot.id)) {
        throw createAppError(400, 'Slot đích trùng với slot hiện tại');
      }
      if (targetSlot.status !== 'FREE') {
        throw createAppError(409, 'Slot đích không ở trạng thái trống');
      }
      if (targetSlot.supported_vehicle_type && targetSlot.supported_vehicle_type !== vehicleType) {
        throw createAppError(409, 'Slot đích không phù hợp loại xe hiện tại');
      }

      let oldSlotCode = null;
      if (session.slot_id) {
        const oldSlotResult = await client.query(
          `SELECT id, slot_code
           FROM parking_slots
           WHERE id = $1
             AND is_deleted = FALSE
           LIMIT 1
           FOR UPDATE`,
          [session.slot_id]
        );
        if (oldSlotResult.rows.length > 0) {
          oldSlotCode = oldSlotResult.rows[0].slot_code;
          await client.query(
            `UPDATE parking_slots
             SET status = 'FREE'
             WHERE id = $1`,
            [oldSlotResult.rows[0].id]
          );
        }
      }

      await client.query(
        `UPDATE parking_slots
         SET status = 'OCCUPIED'
         WHERE id = $1`,
        [targetSlot.id]
      );

      await client.query(
        `UPDATE parking_sessions
         SET slot_id = $1
         WHERE id = $2
           AND time_out IS NULL`,
        [targetSlot.id, session.id]
      );

      return {
        license_plate: licensePlate,
        from_slot_code: oldSlotCode,
        to_slot_code: targetSlot.slot_code
      };
    });

    return sendSuccess(res, 200, { data: result });
  } catch (error) {
    return sendError(res, error);
  }
};

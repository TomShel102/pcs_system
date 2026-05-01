import { runTransaction } from '../db.js';
import { calculateFee } from '../services/pricingService.js';
import { createAppError, sendError, sendSuccess } from '../utils/http.js';
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  rollbackIdempotentRequest
} from '../utils/idempotency.js';
import { logInfo } from '../utils/logger.js';
import { normalizeLicensePlate, requireFields } from '../utils/validation.js';

export const checkOut = async (req, res) => {
  const endpoint = 'POST:/api/check-out';
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

    requireFields(req.body, ['license_plate', 'guard_out_id']);
    const licensePlate = normalizeLicensePlate(req.body.license_plate);
    const guardOutId = String(req.body.guard_out_id).trim();
    const exceptionType = req.body.exception_type ? String(req.body.exception_type).trim() : null;
    const note = req.body.note ? String(req.body.note).trim() : null;
    if (exceptionType && exceptionType !== 'LOST_TICKET') {
      throw createAppError(400, 'Loại ngoại lệ không hợp lệ. Chỉ chấp nhận LOST_TICKET');
    }

    const result = await runTransaction(async (client) => {
      const guardResult = await client.query(
        `SELECT id
         FROM users
         WHERE id = $1
           AND is_deleted = FALSE
         LIMIT 1`,
        [guardOutId]
      );
      if (guardResult.rows.length === 0) {
        throw createAppError(400, 'Mã nhân viên ra bãi không hợp lệ');
      }

      // Tìm phiên gửi xe đang mở theo biển số
      const sessionResult = await client.query(
        `SELECT 
          ps.id,
          ps.vehicle_id,
          ps.slot_id,
          ps.time_in,
          ps.monthly_ticket_id,
          v.license_plate,
          v.vehicle_type
        FROM parking_sessions ps
        JOIN vehicles v ON ps.vehicle_id = v.id
        WHERE v.license_plate = $1 
          AND ps.time_out IS NULL
          AND ps.is_deleted = FALSE
          AND v.is_deleted = FALSE
        LIMIT 1
        FOR UPDATE OF ps`,
        [licensePlate]
      );

      // Không tìm thấy phiên đang gửi xe -> trả lỗi 400
      if (sessionResult.rows.length === 0) {
        throw createAppError(404, 'Không tìm thấy phiên gửi xe đang hoạt động cho biển số này');
      }

      const session = sessionResult.rows[0];
      const timeOut = new Date();
      let totalFee = 0;

      // Tính phí dựa trên loại ngoại lệ
      if (exceptionType === 'LOST_TICKET') {
        totalFee = 50000;
      } else {
        const pricingResult = await client.query(
          `SELECT free_minutes, day_rate, night_rate, max_daily_fee
           FROM pricing_config
           WHERE vehicle_type = $1
           LIMIT 1`,
          [session.vehicle_type]
        );

        if (pricingResult.rows.length === 0) {
          throw createAppError(400, `Chưa cấu hình bảng giá cho loại xe: ${session.vehicle_type}`);
        }

        const hasMonthlyTicket = session.monthly_ticket_id !== null;
        totalFee = calculateFee(
          new Date(session.time_in),
          timeOut,
          hasMonthlyTicket,
          pricingResult.rows[0]
        );
      }

      // Cập nhật thông tin xe ra cho phiên gửi xe
      const updateResult = await client.query(
        `UPDATE parking_sessions
        SET 
          time_out = $1,
          total_fee = $2,
          guard_out_id = $3,
          exception_type = $4,
          note = $5
        WHERE id = $6
          AND time_out IS NULL
          AND is_deleted = FALSE
        RETURNING id, vehicle_id, time_in, time_out, total_fee, exception_type, note, guard_out_id`,
        [timeOut, totalFee, guardOutId, exceptionType, note, session.id]
      );

      if (updateResult.rows.length === 0) {
        throw createAppError(409, 'Phiên gửi xe đã được xử lý bởi một giao dịch khác');
      }

      const updatedSession = updateResult.rows[0];
      if (session.slot_id) {
        await client.query(
          `UPDATE parking_slots
           SET status = 'FREE'
           WHERE id = $1
             AND is_deleted = FALSE`,
          [session.slot_id]
        );
      }

      // Trả về hóa đơn
      return {
        id: updatedSession.id,
        license_plate: licensePlate,
        time_in: updatedSession.time_in,
        time_out: updatedSession.time_out,
        total_fee: updatedSession.total_fee,
        exception_type: updatedSession.exception_type,
        note: updatedSession.note,
        guard_out_id: updatedSession.guard_out_id
      };
    });

    const payload = {
      invoice: result
    };
    await completeIdempotentRequest(idempotencyRecordId, 200, { success: true, ...payload });
    logInfo('parking.check_out.success', {
      license_plate: licensePlate,
      session_id: result.id,
      guard_out_id: guardOutId,
      total_fee: result.total_fee
    });
    return sendSuccess(res, 200, payload);
  } catch (error) {
    await rollbackIdempotentRequest(idempotencyRecordId);
    return sendError(res, error);
  }
};

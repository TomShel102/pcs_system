import { query, runTransaction } from '../db.js';
import { createAppError, sendError, sendSuccess } from '../utils/http.js';
import { normalizeLicensePlate, requireFields } from '../utils/validation.js';

export const createMonthlyTicket = async (req, res) => {
  try {
    requireFields(req.body, ['license_plate', 'customer_name', 'expiration_date']);
    const licensePlate = normalizeLicensePlate(req.body.license_plate);
    const customerName = String(req.body.customer_name).trim();
    const expirationDate = String(req.body.expiration_date).trim();

    const result = await runTransaction(async (client) => {
      const vehicleResult = await client.query(
        `SELECT id, license_plate
         FROM vehicles
         WHERE license_plate = $1
           AND is_deleted = FALSE
         LIMIT 1`,
        [licensePlate]
      );

      if (vehicleResult.rows.length === 0) {
        throw createAppError(400, 'Không tìm thấy xe theo biển số đã cung cấp');
      }

      const vehicleId = vehicleResult.rows[0].id;

      const activeTicketResult = await client.query(
        `SELECT id
         FROM monthly_tickets
         WHERE vehicle_id = $1
           AND is_deleted = FALSE
           AND expiration_date >= CURRENT_DATE
         LIMIT 1`,
        [vehicleId]
      );

      if (activeTicketResult.rows.length > 0) {
        throw createAppError(409, 'Xe này đã có vé tháng còn hiệu lực');
      }

      const insertResult = await client.query(
        `INSERT INTO monthly_tickets (vehicle_id, customer_name, expiration_date, is_deleted)
         VALUES ($1, $2, $3, FALSE)
         RETURNING id, vehicle_id, customer_name, expiration_date`,
        [vehicleId, customerName, expirationDate]
      );

      return insertResult.rows[0];
    });

    return sendSuccess(res, 201, {
      data: result
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getMonthlyTicketByLicensePlate = async (req, res) => {
  try {
    const licensePlate = normalizeLicensePlate(req.params.license_plate);
    if (!licensePlate) {
      throw createAppError(400, 'Thiếu biển số xe cần tra cứu');
    }

    const ticketResult = await query(
      `SELECT
        mt.id,
        mt.vehicle_id,
        v.license_plate,
        mt.customer_name,
        mt.expiration_date,
        (mt.expiration_date >= CURRENT_DATE) AS is_active
      FROM monthly_tickets mt
      JOIN vehicles v ON v.id = mt.vehicle_id
      WHERE v.license_plate = $1
        AND mt.is_deleted = FALSE
        AND v.is_deleted = FALSE
      ORDER BY mt.expiration_date DESC
      LIMIT 1`,
      [licensePlate]
    );

    if (ticketResult.rows.length === 0) {
      throw createAppError(404, 'Không tìm thấy vé tháng theo biển số này');
    }

    return sendSuccess(res, 200, {
      data: ticketResult.rows[0]
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const renewMonthlyTicketByLicensePlate = async (req, res) => {
  try {
    requireFields(req.body, ['expiration_date']);
    const licensePlate = normalizeLicensePlate(req.params.license_plate);
    const newExpirationDate = String(req.body.expiration_date).trim();
    const customerName = req.body.customer_name ? String(req.body.customer_name).trim() : null;
    if (!licensePlate) {
      throw createAppError(400, 'Thiếu biển số xe cần gia hạn');
    }

    const result = await runTransaction(async (client) => {
      const lookupResult = await client.query(
        `SELECT
          mt.id,
          mt.customer_name,
          mt.expiration_date
        FROM monthly_tickets mt
        JOIN vehicles v ON v.id = mt.vehicle_id
        WHERE v.license_plate = $1
          AND mt.is_deleted = FALSE
          AND v.is_deleted = FALSE
        ORDER BY mt.expiration_date DESC
        LIMIT 1`,
        [licensePlate]
      );

      if (lookupResult.rows.length === 0) {
        throw createAppError(404, 'Không tìm thấy vé tháng để gia hạn');
      }

      const ticket = lookupResult.rows[0];
      if (new Date(newExpirationDate).getTime() <= new Date(ticket.expiration_date).getTime()) {
        throw createAppError(400, 'Ngày gia hạn mới phải lớn hơn hạn hiện tại');
      }
      const updateResult = await client.query(
        `UPDATE monthly_tickets
         SET expiration_date = $1,
             customer_name = COALESCE($2, customer_name)
         WHERE id = $3
         RETURNING id, customer_name, expiration_date`,
        [newExpirationDate, customerName, ticket.id]
      );
      await client.query(
        `INSERT INTO monthly_ticket_renewals (monthly_ticket_id, old_expiration_date, new_expiration_date)
         VALUES ($1, $2, $3)`,
        [ticket.id, ticket.expiration_date, newExpirationDate]
      );

      return updateResult.rows[0];
    });

    return sendSuccess(res, 200, {
      data: {
        license_plate: licensePlate,
        ...result
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getMonthlyTicketRenewalHistory = async (req, res) => {
  try {
    const licensePlate = normalizeLicensePlate(req.params.license_plate);
    if (!licensePlate) {
      throw createAppError(400, 'Thiếu biển số xe cần tra cứu lịch sử');
    }

    const historyResult = await query(
      `SELECT
        r.id,
        r.old_expiration_date,
        r.new_expiration_date,
        r.changed_at
      FROM monthly_ticket_renewals r
      JOIN monthly_tickets mt ON mt.id = r.monthly_ticket_id
      JOIN vehicles v ON v.id = mt.vehicle_id
      WHERE v.license_plate = $1
        AND mt.is_deleted = FALSE
        AND v.is_deleted = FALSE
      ORDER BY r.changed_at DESC
      LIMIT 20`,
      [licensePlate]
    );

    return sendSuccess(res, 200, {
      data: {
        license_plate: licensePlate,
        renewals: historyResult.rows
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
};

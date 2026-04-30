import 'dotenv/config';
import pool from '../src/db.js';
import { validateEnvironment } from '../src/utils/env.js';

const printAuditRow = (label, value) => {
  console.log(`${label}: ${value}`);
};

const run = async () => {
  validateEnvironment();

  const [
    duplicateActiveSessions,
    invalidVehicleTypeRows,
    missingPricingRows,
    invalidTimeRows,
    activeMonthlyTicketDuplicates
  ] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM (
         SELECT vehicle_id
         FROM parking_sessions
         WHERE time_out IS NULL
           AND is_deleted = FALSE
         GROUP BY vehicle_id
         HAVING COUNT(*) > 1
       ) duplicated`
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM vehicles
       WHERE is_deleted = FALSE
         AND vehicle_type NOT IN ('MOTORBIKE', 'CAR', 'SUV', 'TRUCK')`
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM vehicles v
       LEFT JOIN pricing_config pc ON pc.vehicle_type = v.vehicle_type
       WHERE v.is_deleted = FALSE
         AND pc.id IS NULL`
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM parking_sessions
       WHERE is_deleted = FALSE
         AND time_out IS NOT NULL
         AND time_out < time_in`
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM (
         SELECT vehicle_id
         FROM monthly_tickets
         WHERE is_deleted = FALSE
           AND expiration_date >= CURRENT_DATE
         GROUP BY vehicle_id
         HAVING COUNT(*) > 1
       ) duplicated`
    )
  ]);

  printAuditRow('Xe có nhiều phiên đang mở', duplicateActiveSessions.rows[0].total);
  printAuditRow('Xe có loại xe không hợp lệ', invalidVehicleTypeRows.rows[0].total);
  printAuditRow('Xe thiếu cấu hình bảng giá', missingPricingRows.rows[0].total);
  printAuditRow('Phiên gửi xe có time_out < time_in', invalidTimeRows.rows[0].total);
  printAuditRow('Xe có nhiều vé tháng còn hiệu lực', activeMonthlyTicketDuplicates.rows[0].total);
};

run()
  .catch((error) => {
    console.error('Kiểm tra dữ liệu thất bại:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

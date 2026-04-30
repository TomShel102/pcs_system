-- update_v3.sql
-- Chuẩn hóa vehicle_type cũ về bộ giá trị chuẩn
UPDATE vehicles
SET vehicle_type = CASE UPPER(TRIM(vehicle_type))
  WHEN '1' THEN 'MOTORBIKE'
  WHEN '2' THEN 'CAR'
  WHEN '3' THEN 'SUV'
  WHEN '4' THEN 'TRUCK'
  ELSE UPPER(TRIM(vehicle_type))
END
WHERE vehicle_type IS NOT NULL;

-- Đồng bộ dữ liệu theo bộ chuẩn được phép
ALTER TABLE vehicles
DROP CONSTRAINT IF EXISTS chk_vehicle_type_valid;

ALTER TABLE vehicles
ADD CONSTRAINT chk_vehicle_type_valid CHECK (vehicle_type IN ('MOTORBIKE', 'CAR', 'SUV', 'TRUCK'));

-- Chặn đồng thời nhiều phiên đang mở cho cùng 1 xe
CREATE UNIQUE INDEX IF NOT EXISTS uq_sessions_one_active_per_vehicle
ON parking_sessions(vehicle_id)
WHERE time_out IS NULL AND is_deleted = FALSE;

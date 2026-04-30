-- update_v5.sql
CREATE TABLE IF NOT EXISTS parking_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS parking_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID NOT NULL REFERENCES parking_areas(id),
    slot_code VARCHAR(20) UNIQUE NOT NULL,
    supported_vehicle_type VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'FREE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_slot_status_valid CHECK (status IN ('FREE', 'OCCUPIED', 'MAINTENANCE'))
);

ALTER TABLE parking_sessions
ADD COLUMN IF NOT EXISTS slot_id UUID REFERENCES parking_slots(id);

CREATE INDEX IF NOT EXISTS idx_parking_slots_area_status
ON parking_slots(area_id, status)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_parking_sessions_slot_active
ON parking_sessions(slot_id)
WHERE time_out IS NULL AND is_deleted = FALSE;

INSERT INTO parking_areas (code, name, is_active, is_deleted)
VALUES
    ('A', 'Khu A', TRUE, FALSE),
    ('B', 'Khu B', TRUE, FALSE),
    ('C', 'Khu C', TRUE, FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO parking_slots (area_id, slot_code, supported_vehicle_type, status, is_active, is_deleted)
SELECT pa.id, 'A' || LPAD(gs::text, 2, '0'), 'MOTORBIKE', 'FREE', TRUE, FALSE
FROM parking_areas pa
CROSS JOIN generate_series(1, 16) gs
WHERE pa.code = 'A'
ON CONFLICT (slot_code) DO NOTHING;

INSERT INTO parking_slots (area_id, slot_code, supported_vehicle_type, status, is_active, is_deleted)
SELECT pa.id, 'B' || LPAD(gs::text, 2, '0'), 'CAR', 'FREE', TRUE, FALSE
FROM parking_areas pa
CROSS JOIN generate_series(1, 10) gs
WHERE pa.code = 'B'
ON CONFLICT (slot_code) DO NOTHING;

INSERT INTO parking_slots (area_id, slot_code, supported_vehicle_type, status, is_active, is_deleted)
SELECT pa.id, 'C' || LPAD(gs::text, 2, '0'), NULL, 'FREE', TRUE, FALSE
FROM parking_areas pa
CROSS JOIN generate_series(1, 8) gs
WHERE pa.code = 'C'
ON CONFLICT (slot_code) DO NOTHING;

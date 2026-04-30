-- init.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('ADMIN', 'GUARD');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'GUARD',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(20) DEFAULT 'MOTORBIKE',
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE pricing_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_type VARCHAR(20) UNIQUE NOT NULL,
    free_minutes INT DEFAULT 10,
    day_rate DECIMAL(10,2) DEFAULT 5000,
    night_rate DECIMAL(10,2) DEFAULT 10000,
    max_daily_fee DECIMAL(10,2) DEFAULT 15000
);

CREATE TABLE monthly_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    customer_name VARCHAR(100),
    expiration_date DATE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE parking_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    guard_in_id UUID REFERENCES users(id),
    guard_out_id UUID REFERENCES users(id),
    monthly_ticket_id UUID REFERENCES monthly_tickets(id),
    time_in TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    time_out TIMESTAMP WITH TIME ZONE,
    total_fee DECIMAL(10,2) DEFAULT 0,
    exception_type VARCHAR(50),
    note TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT chk_time_logic CHECK (time_out IS NULL OR time_out >= time_in)
);

CREATE INDEX idx_vehicles_plate ON vehicles(license_plate);
CREATE INDEX idx_sessions_active ON parking_sessions(vehicle_id) WHERE time_out IS NULL;
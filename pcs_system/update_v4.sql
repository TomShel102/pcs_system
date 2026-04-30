-- update_v4.sql
CREATE TABLE IF NOT EXISTS api_idempotency (
    id BIGSERIAL PRIMARY KEY,
    endpoint VARCHAR(120) NOT NULL,
    idempotency_key VARCHAR(200) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    status_code INT,
    response_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    UNIQUE (endpoint, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_api_idempotency_lookup
ON api_idempotency(endpoint, idempotency_key);

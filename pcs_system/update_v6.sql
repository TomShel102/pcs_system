-- update_v6.sql
CREATE TABLE IF NOT EXISTS monthly_ticket_renewals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monthly_ticket_id UUID NOT NULL REFERENCES monthly_tickets(id),
    old_expiration_date DATE NOT NULL,
    new_expiration_date DATE NOT NULL,
    note TEXT,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_monthly_ticket_renewals_ticket
ON monthly_ticket_renewals(monthly_ticket_id, changed_at DESC);

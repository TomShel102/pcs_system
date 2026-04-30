import { query } from '../db.js';

export const beginIdempotentRequest = async (endpoint, idempotencyKey) => {
  if (!idempotencyKey) {
    return { mode: 'none' };
  }

  const inserted = await query(
    `INSERT INTO api_idempotency (endpoint, idempotency_key, is_completed)
     VALUES ($1, $2, FALSE)
     ON CONFLICT (endpoint, idempotency_key) DO NOTHING
     RETURNING id`,
    [endpoint, idempotencyKey]
  );

  if (inserted.rows.length > 0) {
    return { mode: 'process', recordId: inserted.rows[0].id };
  }

  const existing = await query(
    `SELECT id, is_completed, status_code, response_payload
     FROM api_idempotency
     WHERE endpoint = $1
       AND idempotency_key = $2
       AND expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [endpoint, idempotencyKey]
  );

  if (existing.rows.length === 0) {
    return { mode: 'process', recordId: null };
  }

  const row = existing.rows[0];
  if (row.is_completed) {
    return {
      mode: 'replay',
      statusCode: row.status_code,
      payload: row.response_payload
    };
  }

  return { mode: 'in_progress' };
};

export const completeIdempotentRequest = async (recordId, statusCode, responsePayload) => {
  if (!recordId) {
    return;
  }

  await query(
    `UPDATE api_idempotency
     SET is_completed = TRUE,
         status_code = $2,
         response_payload = $3::jsonb
     WHERE id = $1`,
    [recordId, statusCode, JSON.stringify(responsePayload)]
  );
};

export const rollbackIdempotentRequest = async (recordId) => {
  if (!recordId) {
    return;
  }

  await query(
    `DELETE FROM api_idempotency
     WHERE id = $1
       AND is_completed = FALSE`,
    [recordId]
  );
};

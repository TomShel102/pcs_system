import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

const guardId = '11111111-1111-1111-1111-111111111111';
const asGuard = (req) => req.set('x-guard-id', guardId);

test('Given empty check-in payload When calling endpoint Then return 400 with message', async () => {
  const response = await asGuard(request(app).post('/api/check-in')).send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /license_plate/i);
});

test('Given empty check-out payload When calling endpoint Then return 400 with message', async () => {
  const response = await asGuard(request(app).post('/api/check-out')).send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /guard_out_id/i);
});

test('Given empty monthly ticket payload When calling endpoint Then return 400 with message', async () => {
  const response = await asGuard(request(app).post('/api/monthly-tickets')).send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /license_plate/i);
});

test('Given invalid vehicle type at check-in When calling endpoint Then return 400', async () => {
  const response = await asGuard(request(app).post('/api/check-in')).send({
    license_plate: '29A-99999',
    vehicle_type: 'BUS',
    guard_in_id: guardId
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /Loại xe không hợp lệ/);
});

test('Given concurrent check-out requests When processing same vehicle Then only one request succeeds', async () => {
  const licensePlate = `88A-${Date.now()}`;

  const checkInResponse = await asGuard(request(app).post('/api/check-in')).send({
    license_plate: licensePlate,
    vehicle_type: 'MOTORBIKE',
    guard_in_id: guardId
  });
  assert.equal(checkInResponse.status, 201);

  const [firstCheckOut, secondCheckOut] = await Promise.all([
    asGuard(request(app).post('/api/check-out')).send({
      license_plate: licensePlate,
      guard_out_id: guardId
    }),
    asGuard(request(app).post('/api/check-out')).send({
      license_plate: licensePlate,
      guard_out_id: guardId
    })
  ]);

  const statuses = [firstCheckOut.status, secondCheckOut.status].sort((a, b) => a - b);
  assert.deepEqual(statuses, [200, 404]);
});

test('Given valid guard credentials When login Then returns bearer token', async () => {
  const response = await request(app).post('/api/auth/login').send({
    username: 'guard_demo',
    password: 'demo_hash'
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(typeof response.body.data?.token, 'string');
});

test('Given same idempotency key for check-in When sending duplicate requests Then second response replays first result', async () => {
  const idempotencyKey = `checkin-${Date.now()}`;
  const licensePlate = `77A-${Date.now()}`;

  const firstResponse = await asGuard(
    request(app).post('/api/check-in').set('idempotency-key', idempotencyKey)
  ).send({
    license_plate: licensePlate,
    vehicle_type: 'MOTORBIKE',
    guard_in_id: guardId
  });

  const secondResponse = await asGuard(
    request(app).post('/api/check-in').set('idempotency-key', idempotencyKey)
  ).send({
    license_plate: licensePlate,
    vehicle_type: 'MOTORBIKE',
    guard_in_id: guardId
  });

  assert.equal(firstResponse.status, 201);
  assert.equal(secondResponse.status, 201);
  assert.equal(
    secondResponse.body.data?.sessionId,
    firstResponse.body.data?.sessionId
  );
});

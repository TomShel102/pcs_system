import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLicensePlate, normalizeVehicleType, requireFields } from '../src/utils/validation.js';

test('Given a mixed-case plate with spaces When normalize Then uppercase trimmed value is returned', () => {
  assert.equal(normalizeLicensePlate(' 29a-12345 '), '29A-12345');
});

test('Given missing required fields When validating Then an app error is thrown', () => {
  assert.throws(
    () => requireFields({ license_plate: '' }, ['license_plate', 'guard_out_id']),
    (error) => error.statusCode === 400 && /guard_out_id/.test(error.message)
  );
});

test('Given legacy vehicle type code When normalizing Then value is converted to canonical type', () => {
  assert.equal(normalizeVehicleType('1'), 'MOTORBIKE');
});

test('Given invalid vehicle type When normalizing Then validation error is thrown', () => {
  assert.throws(
    () => normalizeVehicleType('BUS'),
    (error) => error.statusCode === 400 && /Loại xe không hợp lệ/.test(error.message)
  );
});

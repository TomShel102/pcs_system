import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFee } from '../src/services/pricingService.js';

test('Given monthly ticket When calculating fee Then fee is zero', () => {
  const fee = calculateFee(new Date(2026, 0, 1, 8, 0, 0), new Date(2026, 0, 1, 10, 0, 0), true);
  assert.equal(fee, 0);
});

test('Given duration under free window When calculating fee Then fee is zero', () => {
  const fee = calculateFee(new Date(2026, 0, 1, 8, 0, 0), new Date(2026, 0, 1, 8, 9, 0), false);
  assert.equal(fee, 0);
});

test('Given same day touching day and night shifts When calculating fee Then fee is daily capped', () => {
  const fee = calculateFee(new Date(2026, 0, 1, 17, 30, 0), new Date(2026, 0, 1, 19, 30, 0), false);
  assert.equal(fee, 15000);
});

test('Given overnight session crossing two calendar days When calculating fee Then fees are summed per touched shift each day', () => {
  const fee = calculateFee(new Date(2026, 0, 1, 23, 30, 0), new Date(2026, 0, 2, 7, 30, 0), false);
  assert.equal(fee, 25000);
});

test('Given custom pricing config When calculating fee Then config values are applied', () => {
  const fee = calculateFee(
    new Date(2026, 0, 1, 17, 30, 0),
    new Date(2026, 0, 1, 19, 30, 0),
    false,
    { free_minutes: 5, day_rate: 7000, night_rate: 12000, max_daily_fee: 19000 }
  );
  assert.equal(fee, 19000);
});

test('Given custom free minutes When duration is within window Then fee is zero', () => {
  const fee = calculateFee(
    new Date(2026, 0, 1, 8, 0, 0),
    new Date(2026, 0, 1, 8, 4, 0),
    false,
    { free_minutes: 5, day_rate: 5000, night_rate: 10000, max_daily_fee: 15000 }
  );
  assert.equal(fee, 0);
});

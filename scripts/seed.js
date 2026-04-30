import 'dotenv/config';
import pool from '../src/db.js';
import { validateEnvironment } from '../src/utils/env.js';

const run = async () => {
  validateEnvironment();

  await pool.query(
    `INSERT INTO users (id, username, password_hash, role, is_deleted)
     VALUES ($1, $2, $3, 'GUARD', FALSE)
     ON CONFLICT (id) DO NOTHING`,
    ['11111111-1111-1111-1111-111111111111', 'guard_demo', 'demo_hash']
  );

  await pool.query(
    `INSERT INTO pricing_config (vehicle_type, free_minutes, day_rate, night_rate, max_daily_fee)
     VALUES
       ('MOTORBIKE', 10, 5000, 10000, 15000),
       ('CAR', 10, 10000, 15000, 25000),
       ('SUV', 10, 15000, 20000, 30000),
       ('TRUCK', 10, 20000, 30000, 40000)
     ON CONFLICT (vehicle_type) DO NOTHING`
  );

  console.log('✓ Seed completed');
};

run()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

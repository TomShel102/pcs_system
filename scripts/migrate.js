import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pool from '../src/db.js';
import { validateEnvironment } from '../src/utils/env.js';

const migrationFiles = ['pcs_system/init.sql', 'pcs_system/update_v2.sql', 'pcs_system/update_v3.sql', 'pcs_system/update_v4.sql', 'pcs_system/update_v5.sql', 'pcs_system/update_v6.sql'];

const shouldIgnoreError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('already exists');
};

const runSqlFile = async (migrationFile) => {
  const absolutePath = resolve(process.cwd(), migrationFile);
  const sql = await readFile(absolutePath, 'utf-8');
  const statements = sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (error) {
      if (!shouldIgnoreError(error)) {
        throw error;
      }
    }
  }
};

const run = async () => {
  validateEnvironment();

  for (const migrationFile of migrationFiles) {
    await runSqlFile(migrationFile);
    console.log(`✓ Applied migration: ${migrationFile}`);
  }
};

run()
  .catch((error) => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

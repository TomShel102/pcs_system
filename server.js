import 'dotenv/config';
import app from './src/app.js';
import pool from './src/db.js';
import { getAppConfig } from './src/utils/env.js';

const { port } = getAppConfig();

// Database connection check
pool.on('connect', () => {
  console.log('✓ Database connected');
});

pool.on('error', (err) => {
  console.error('✗ Database connection error:', err);
});

// Start server
const server = app.listen(port, () => {
  console.log(`✓ Server running at http://localhost:${port}`);
  console.log('✓ Database status: Ready');
});

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('✓ Database pool closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

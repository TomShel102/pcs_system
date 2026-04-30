const requiredEnvKeys = ['DB_USER', 'DB_HOST', 'DB_PORT', 'DB_NAME'];

export const validateEnvironment = () => {
  const missingKeys = requiredEnvKeys.filter((key) => {
    const value = process.env[key];
    return value === undefined || String(value).trim() === '';
  });

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }
};

export const getAppConfig = () => {
  validateEnvironment();

  const rawCorsOrigins = process.env.CORS_ORIGIN || '*';
  const corsOrigins = rawCorsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    port: Number(process.env.PORT) || 3000,
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,
    logFormat: process.env.LOG_FORMAT || 'combined',
    corsOrigins,
    authSecret: process.env.AUTH_SECRET || 'pcs-dev-secret',
    authTokenTtlMs: Number(process.env.AUTH_TOKEN_TTL_MS) || 12 * 60 * 60 * 1000,
    authCompatMode: String(process.env.AUTH_COMPAT_MODE || 'true').toLowerCase() !== 'false',
    authEnforced: String(process.env.AUTH_ENFORCED || 'false').toLowerCase() !== 'false'
  };
};

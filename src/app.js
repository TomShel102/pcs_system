import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { randomUUID } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import apiRoutes from './routes/apiRoutes.js';
import pool from './db.js';
import { getAppConfig } from './utils/env.js';
import { logInfo } from './utils/logger.js';

const appConfig = getAppConfig();

const app = express();
const allowsAllOrigins = appConfig.corsOrigins.includes('*');

morgan.token('request-id', (req) => req.requestId);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        fontSrc: ["'self'", 'https:', 'data:'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"]
      }
    }
  })
);
app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowsAllOrigins || appConfig.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Không được phép truy cập bởi chính sách CORS'));
    }
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: appConfig.rateLimitWindowMs,
    limit: appConfig.rateLimitMaxRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' }
  })
);
const morganFormat = appConfig.logFormat === 'combined'
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" req_id=:request-id'
  : appConfig.logFormat;
app.use(morgan(morganFormat));

// Static files
app.use(express.static('./'));

// API routes
app.use('/api', apiRoutes);

// Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile('./index.html', { root: '.' });
});

// Redirect /dashboard to root
app.get('/dashboard', (req, res) => {
  res.redirect('/');
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    logInfo('system.health.ok', { request_id: req.requestId });
    return res.status(200).json({ success: true, message: 'Hệ thống hoạt động bình thường' });
  } catch (error) {
    return res.status(503).json({ success: false, message: 'Cơ sở dữ liệu không khả dụng' });
  }
});

app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    logInfo('system.ready.ok', { request_id: req.requestId });
    return res.status(200).json({ success: true, message: 'Hệ thống sẵn sàng phục vụ' });
  } catch (error) {
    return res.status(503).json({ success: false, message: 'Hệ thống chưa sẵn sàng' });
  }
});

app.use((err, req, res, next) => {
  if (err && err.message === 'Không được phép truy cập bởi chính sách CORS') {
    return res.status(403).json({
      success: false,
      message: 'Nguồn truy cập không được phép'
    });
  }
  return next(err);
});

export default app;

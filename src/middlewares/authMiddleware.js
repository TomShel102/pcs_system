import { query } from '../db.js';
import { createAppError } from '../utils/http.js';
import { verifyAuthToken } from '../utils/authToken.js';
import { getAppConfig } from '../utils/env.js';

const appConfig = getAppConfig();

const loadUserById = async (userId) => {
  const userResult = await query(
    `SELECT id, username, role
     FROM users
     WHERE id = $1
       AND is_deleted = FALSE
     LIMIT 1`,
    [userId]
  );
  return userResult.rows[0] || null;
};

const getGuardIdFromCompatRequest = (req) => {
  const headerGuardId = req.headers['x-guard-id'];
  if (headerGuardId && String(headerGuardId).trim() !== '') {
    return String(headerGuardId).trim();
  }

  const bodyGuardInId = req.body?.guard_in_id;
  if (bodyGuardInId && String(bodyGuardInId).trim() !== '') {
    return String(bodyGuardInId).trim();
  }

  const bodyGuardOutId = req.body?.guard_out_id;
  if (bodyGuardOutId && String(bodyGuardOutId).trim() !== '') {
    return String(bodyGuardOutId).trim();
  }

  return null;
};

export const authenticateRequest = async (req, res, next) => {
  try {
    const authorization = String(req.headers.authorization || '');
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';

    if (token) {
      const payload = verifyAuthToken(token, appConfig.authSecret);
      const user = await loadUserById(payload.sub);
      if (!user) {
        throw createAppError(401, 'Tài khoản không tồn tại hoặc đã bị khóa');
      }
      req.authUser = user;
      return next();
    }

    if (appConfig.authCompatMode) {
      const guardId = getGuardIdFromCompatRequest(req);
      if (guardId) {
        const user = await loadUserById(guardId);
        if (!user) {
          throw createAppError(401, 'Guard ID không hợp lệ');
        }
        req.authUser = user;
        return next();
      }
    }

    throw createAppError(401, 'Thiếu thông tin xác thực');
  } catch (error) {
    return res.status(error?.statusCode || 401).json({
      success: false,
      message: error?.message || 'Xác thực thất bại'
    });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.authUser?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này'
      });
    }
    return next();
  };
};

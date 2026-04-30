import { query } from '../db.js';
import { createAppError, sendError, sendSuccess } from '../utils/http.js';
import { signAuthToken } from '../utils/authToken.js';
import { getAppConfig } from '../utils/env.js';
import { requireFields } from '../utils/validation.js';

const appConfig = getAppConfig();

export const login = async (req, res) => {
  try {
    requireFields(req.body, ['username', 'password']);
    const username = String(req.body.username).trim();
    const password = String(req.body.password).trim();

    const userResult = await query(
      `SELECT id, username, password_hash, role
       FROM users
       WHERE username = $1
         AND is_deleted = FALSE
       LIMIT 1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      throw createAppError(401, 'Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const user = userResult.rows[0];
    if (user.password_hash !== password) {
      throw createAppError(401, 'Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const expiresAt = Date.now() + appConfig.authTokenTtlMs;
    const token = signAuthToken(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        exp: expiresAt
      },
      appConfig.authSecret
    );

    return sendSuccess(res, 200, {
      data: {
        token,
        expires_at: new Date(expiresAt).toISOString(),
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
};

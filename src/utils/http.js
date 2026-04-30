import { logError } from './logger.js';

export const createAppError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const sendSuccess = (res, statusCode, payload) => {
  return res.status(statusCode).json({
    success: true,
    ...payload
  });
};

export const sendError = (res, error, fallbackMessage = 'Lỗi hệ thống, vui lòng thử lại sau') => {
  const statusCode = error?.statusCode || 500;
  const message = error?.message || fallbackMessage;

  if (statusCode >= 500) {
    logError('http.unhandled_error', error);
  }

  return res.status(statusCode).json({
    success: false,
    message
  });
};

import { logger } from '../utils/logger.js';

/**
 * Centralized error handler returning standard format:
 * { "ok": false, "error": { "code": string, "message": string } }
 * Never leaks stack traces or upstream credentials.
 */
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || (status === 400 ? 'INVALID_INPUT' : status === 429 ? 'RATE_LIMITED' : 'INTERNAL_ERROR');
  const message = err.clientMessage || (status === 500 ? 'An internal error occurred. Please try again later.' : err.message);

  logger.error(`HTTP ${status} Error`, err);

  res.status(status).json({
    ok: false,
    error: {
      code,
      message
    }
  });
}

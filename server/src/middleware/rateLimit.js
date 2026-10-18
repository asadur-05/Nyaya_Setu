import rateLimit from 'express-rate-limit';
import { config } from '../utils/config.js';

export const chatRateLimiter = rateLimit({
  windowMs: config.chatRateLimit.windowMs,
  max: config.chatRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.setHeader('Retry-After', Math.ceil(config.chatRateLimit.windowMs / 1000));
    res.status(429).json({
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a moment before sending another query.'
      }
    });
  }
});

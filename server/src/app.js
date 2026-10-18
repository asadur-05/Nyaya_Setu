import express from 'express';
import cors from 'cors';
import { config } from './utils/config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { sourcesRouter } from './routes/sources.js';
import { chatRouter } from './routes/chat.js';

export function createApp() {
  const app = express();

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // CORS with explicit origin
  app.use(cors({
    origin: config.clientOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Body parser with strict size limit
  app.use(express.json({ limit: '64kb' }));

  // Routes
  app.use('/api', healthRouter);
  app.use('/api', sourcesRouter);
  app.use('/api', chatRouter);

  // Catch-all 404 handler
  app.use((req, res) => {
    res.status(404).json({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.path} not found.`
      }
    });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();

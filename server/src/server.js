import { app } from './app.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import { defaultKbService } from './services/knowledgeBaseService.js';

const server = app.listen(config.port, () => {
  const kbInfo = defaultKbService.getVersionInfo();
  logger.info(`NyayaSetu_AI server listening on port ${config.port} (mode: ${config.demoMode ? 'demo' : 'live'}, KB v${kbInfo.knowledgeBaseVersion})`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully.');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully.');
  server.close(() => process.exit(0));
});

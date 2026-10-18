import { Router } from 'express';
import { config } from '../utils/config.js';
import { defaultKbService } from '../services/knowledgeBaseService.js';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  const kbInfo = defaultKbService.getVersionInfo();
  const isConfigured = Boolean(config.geminiApiKey);
  const mode = config.demoMode || !isConfigured ? 'demo' : 'live';

  res.json({
    ok: true,
    status: 'up',
    geminiConfigured: isConfigured,
    mode,
    knowledgeBaseVersion: kbInfo.knowledgeBaseVersion,
    entryCount: kbInfo.activeEntryCount
  });
});

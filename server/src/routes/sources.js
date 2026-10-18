import { Router } from 'express';
import { defaultKbService } from '../services/knowledgeBaseService.js';

export const sourcesRouter = Router();

sourcesRouter.get('/sources', (req, res) => {
  const kbInfo = defaultKbService.getVersionInfo();
  const changelog = defaultKbService.getChangelog(5);
  const activeEntries = defaultKbService.getActiveEntries();

  const formattedSources = activeEntries.map(e => ({
    id: e.id,
    title: e.title,
    topic: e.topic,
    jurisdiction: e.jurisdiction,
    sourceName: e.sourceName,
    sourceUrl: e.sourceUrl,
    sourceType: e.sourceType,
    effectiveDate: e.effectiveDate,
    lastVerified: e.lastVerified,
    version: e.version
  }));

  res.json({
    ok: true,
    knowledgeBaseVersion: kbInfo.knowledgeBaseVersion,
    updatedAt: kbInfo.updatedAt,
    changelog,
    sources: formattedSources
  });
});

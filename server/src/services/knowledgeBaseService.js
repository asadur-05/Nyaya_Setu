import fs from 'node:fs';
import path from 'node:path';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { validateKnowledgeBase } from '../utils/kbSchema.js';

export class KnowledgeBaseService {
  constructor(options = {}) {
    this.dataDir = options.dataDir ? path.resolve(options.dataDir) : config.kbDataDir;
    this.allowTestIds = Boolean(options.allowTestIds);
    this.injectedKb = options.injectedKb || null;
    this.cachedKb = null;
    this.cachedChangelog = null;
    this.lastMtimeMs = 0;

    this.init();
  }

  init() {
    if (this.injectedKb) {
      const validation = validateKnowledgeBase(this.injectedKb, { allowTestIds: this.allowTestIds });
      if (!validation.valid) {
        throw new Error(`Injected Knowledge Base failed validation: ${validation.errors.join('; ')}`);
      }
      this.cachedKb = this.injectedKb;
      this.cachedChangelog = [];
      return;
    }

    this.reloadIfNeeded(true);
  }

  getSourcesFilePath() {
    return path.join(this.dataDir, 'legalSources.json');
  }

  getChangelogFilePath() {
    return path.join(this.dataDir, 'kbChangelog.json');
  }

  reloadIfNeeded(force = false) {
    if (this.injectedKb) return;

    const sourcesPath = this.getSourcesFilePath();
    if (!fs.existsSync(sourcesPath)) {
      throw new Error(`Knowledge base file not found at: ${sourcesPath}`);
    }

    try {
      const stat = fs.statSync(sourcesPath);
      if (force || stat.mtimeMs > this.lastMtimeMs) {
        const raw = fs.readFileSync(sourcesPath, 'utf8');
        const parsed = JSON.parse(raw);

        // Check if dataDir is real data dir vs test copy
        const isRealDataDir = path.resolve(this.dataDir) === path.resolve(config.kbDataDir);
        const allowTestIds = this.allowTestIds || !isRealDataDir;

        const validation = validateKnowledgeBase(parsed, { allowTestIds });
        if (!validation.valid) {
          throw new Error(`Knowledge base validation failed: ${validation.errors.join('; ')}`);
        }

        this.cachedKb = parsed;
        this.lastMtimeMs = stat.mtimeMs;

        // Load changelog
        const changelogPath = this.getChangelogFilePath();
        if (fs.existsSync(changelogPath)) {
          const rawChangelog = fs.readFileSync(changelogPath, 'utf8');
          this.cachedChangelog = JSON.parse(rawChangelog);
        } else {
          this.cachedChangelog = [];
        }

        logger.info({
          message: `Loaded knowledge base v${parsed.knowledgeBaseVersion} (${parsed.entries.length} entries)`,
          knowledgeBaseVersion: parsed.knowledgeBaseVersion
        });
      }
    } catch (err) {
      logger.error('Failed to load/reload knowledge base', err);
      throw err;
    }
  }

  getKnowledgeBase() {
    this.reloadIfNeeded();
    return this.cachedKb;
  }

  getActiveEntries() {
    this.reloadIfNeeded();
    return (this.cachedKb.entries || []).filter(e => e.status === 'active');
  }

  getEntryById(id) {
    this.reloadIfNeeded();
    return (this.cachedKb.entries || []).find(e => e.id === id) || null;
  }

  getVersionInfo() {
    this.reloadIfNeeded();
    return {
      knowledgeBaseVersion: this.cachedKb.knowledgeBaseVersion,
      updatedAt: this.cachedKb.updatedAt,
      entryCount: (this.cachedKb.entries || []).length,
      activeEntryCount: this.getActiveEntries().length
    };
  }

  getChangelog(limit = 5) {
    this.reloadIfNeeded();
    const list = Array.isArray(this.cachedChangelog) ? this.cachedChangelog : [];
    return list.slice(-limit).reverse();
  }

  getLegalAidReferralEntry() {
    const active = this.getActiveEntries();
    // Find active entry of type legal-aid-authority (e.g. nalsa-free-legal-aid)
    return active.find(e => e.sourceType === 'legal-aid-authority') || null;
  }
}

export const defaultKbService = new KnowledgeBaseService();

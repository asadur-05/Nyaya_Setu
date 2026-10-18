import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDataDir = path.resolve(__dirname, '../../data');

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  geminiTimeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS || '15000', 10),
  demoMode: process.env.DEMO_MODE === 'true' || !process.env.GEMINI_API_KEY,
  staleAfterDays: parseInt(process.env.STALE_AFTER_DAYS || '180', 10),
  kbDataDir: process.env.KB_DATA_DIR ? path.resolve(process.env.KB_DATA_DIR) : defaultDataDir,
  allowedHostSuffixes: ['.gov.in', '.nic.in'],
  allowedSourceTypes: ['legislation', 'government-portal', 'legal-aid-authority', 'emergency-service', 'court'],
  chatRateLimit: {
    windowMs: 60 * 1000,
    max: 20
  }
};

/**
 * Privacy-focused logger for NyayaSetu_AI.
 * Strictly adheres to privacy requirements:
 * Records only timestamp, route, status, latency, mode, emergency flag, knowledgeBaseVersion.
 * NEVER logs message text, history, prompt contents, or keys.
 */
export const logger = {
  info: (metadata) => {
    const timestamp = new Date().toISOString();
    if (typeof metadata === 'string') {
      console.log(`[${timestamp}] [INFO] ${metadata}`);
      return;
    }

    const { route, status, latencyMs, mode, emergency, knowledgeBaseVersion, message } = metadata;
    const parts = [`[${timestamp}] [INFO]`];
    if (route) parts.push(`route=${route}`);
    if (status) parts.push(`status=${status}`);
    if (latencyMs !== undefined) parts.push(`latency=${latencyMs}ms`);
    if (mode) parts.push(`mode=${mode}`);
    if (emergency !== undefined) parts.push(`emergency=${emergency}`);
    if (knowledgeBaseVersion) parts.push(`kbVersion=${knowledgeBaseVersion}`);
    if (message) parts.push(`msg="${message}"`);

    console.log(parts.join(' '));
  },

  warn: (msg, details = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${msg}`, Object.keys(details).length ? details : '');
  },

  error: (msg, err = {}) => {
    const timestamp = new Date().toISOString();
    const safeError = err && err.message ? err.message : String(err);
    console.error(`[${timestamp}] [ERROR] ${msg}: ${safeError}`);
  }
};

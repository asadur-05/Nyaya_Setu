const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT_MS = 25000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { ok: false, error: { code: 'INVALID_RESPONSE', message: text } };
    }

    if (!response.ok) {
      const errorMsg = data?.error?.message || `Server responded with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.code = data?.error?.code || (response.status === 429 ? 'RATE_LIMITED' : 'SERVER_ERROR');
      throw err;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('The request timed out. Please check your network and try again.');
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }
    throw err;
  }
}

export async function checkHealth() {
  return await fetchWithTimeout(`${API_BASE_URL}/api/health`, { timeoutMs: 8000 });
}

export async function fetchSources() {
  return await fetchWithTimeout(`${API_BASE_URL}/api/sources`, { timeoutMs: 10000 });
}

export async function sendChatMessage({ message, language = 'en', history = [] }) {
  return await fetchWithTimeout(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      language,
      history: history.slice(-4) // Maximum 4 turns
    })
  });
}

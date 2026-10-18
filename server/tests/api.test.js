import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

test('API Integration: health, sources, validation, and chat workflows', async (t) => {
  const app = createApp();
  let server;
  let baseUrl;

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  t.after(() => {
    if (server) server.close();
  });

  // 1. GET /api/health
  await t.test('GET /api/health returns system status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.status, 'up');
    assert.equal(typeof data.knowledgeBaseVersion, 'string');
    assert.equal(typeof data.mode, 'string');
    assert.equal(typeof data.entryCount, 'number');
    assert.ok(data.entryCount > 0);
  });

  // 2. GET /api/sources
  await t.test('GET /api/sources returns verified sources and changelog', async () => {
    const res = await fetch(`${baseUrl}/api/sources`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(Array.isArray(data.sources));
    assert.ok(data.sources.length >= 6);
    assert.ok(Array.isArray(data.changelog));
    assert.ok(data.sources.every(s => s.sourceUrl.startsWith('https://')));
  });

  // 3. POST /api/chat input validations (400)
  await t.test('POST /api/chat rejects invalid inputs', async () => {
    // Empty message
    const emptyRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ', language: 'en' })
    });
    assert.equal(emptyRes.status, 400);
    const emptyData = await emptyRes.json();
    assert.equal(emptyData.error.code, 'INVALID_INPUT');

    // Message too long (> 1000)
    const longRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'a'.repeat(1001), language: 'en' })
    });
    assert.equal(longRes.status, 400);

    // Invalid language
    const langRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello', language: 'fr' })
    });
    assert.equal(langRes.status, 400);

    // History too long (> 4 turns)
    const histRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        language: 'en',
        history: [
          { role: 'user', content: '1' },
          { role: 'assistant', content: '2' },
          { role: 'user', content: '3' },
          { role: 'assistant', content: '4' },
          { role: 'user', content: '5' }
        ]
      })
    });
    assert.equal(histRes.status, 400);
  });

  // 4. POST /api/chat emergency bypass
  await t.test('POST /api/chat handles immediate danger with emergency response', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Help me! Someone is attacking me with a weapon right now!',
        language: 'en'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.emergency, true);
    assert.equal(data.mode, 'emergency');
    assert.ok(data.answer.includes('112'));
    assert.ok(data.answer.includes('https://112.gov.in/'));
  });

  // 5. POST /api/chat grounded legal query in demo/fallback mode
  await t.test('POST /api/chat returns grounded answer and referral', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Can women get free legal aid under NALSA without income proof?',
        language: 'en'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.sources.length > 0);
    assert.equal(data.sources[0].id, 'nalsa-free-legal-aid');
    assert.ok(data.sources[0].url.startsWith('https://'));
    assert.ok(data.referral !== null);
  });
});

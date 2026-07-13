const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const BASE = process.env.API_BASE_URL || 'http://127.0.0.1:5000';
const ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

describe('API smoke tests', { skip: process.env.SKIP_API_TESTS === 'true' }, () => {
  let token = '';

  it('GET /api/health returns database ok', async () => {
    const { response, body } = await request('/api/health');
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.database, 'ok');
  });

  it('GET /api/events/active returns event or 404', async () => {
    const { response, body } = await request('/api/events/active');
    assert.ok([200, 404].includes(response.status));
    if (response.status === 200) {
      assert.ok(body.data?.id);
    }
  });

  it('POST /api/admin/login authenticates admin', async () => {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const { response, body } = await request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    assert.equal(response.status, 200);
    assert.ok(body.data?.token);
    token = body.data.token;
  });

  it('GET /api/admin/guests requires auth', async () => {
    const unauth = await request('/api/admin/guests');
    assert.equal(unauth.response.status, 401);

    const authed = await request('/api/admin/guests', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(authed.response.status, 200);
    assert.equal(authed.body.success, true);
  });

  it('blocks direct /uploads access', async () => {
    const { response } = await request('/uploads/qr/test.png');
    assert.equal(response.status, 403);
  });

  it('GET /api/admin/guests/:id/qr returns image when authed', async () => {
    const assets = await request('/api/admin/guests', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const guestId = assets.body?.data?.[0]?.id;
    assert.ok(guestId, 'expected at least one guest');

    const response = await fetch(`${BASE}/api/admin/guests/${guestId}/qr`, {
      headers: { Authorization: `Bearer ${token}`, Origin: ORIGIN },
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /image\//);
  });

  it('rejects invalid UUID format', async () => {
    const { response, body } = await request('/api/guests/uuid/not-valid/success');
    assert.equal(response.status, 400);
    assert.match(body.message, /Invalid guest identifier/i);
  });
});

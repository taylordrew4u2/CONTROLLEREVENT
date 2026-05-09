const { put, list } = require('@vercel/blob');

const PATHNAME = 'controllerEvent/state.json';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function requireToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    const err = new Error('Missing BLOB_READ_WRITE_TOKEN env var.');
    err.code = 'missing_env';
    throw err;
  }
  return token;
}

async function loadState() {
  const token = requireToken();
  const { blobs } = await list({ prefix: PATHNAME, limit: 1, token });
  const blob = blobs.find((b) => b.pathname === PATHNAME);
  if (!blob) return null;
  const res = await fetch(blob.url, { cache: 'no-store' });
  if (!res.ok) {
    const err = new Error(`Failed to fetch blob (${res.status})`);
    err.code = 'blob_fetch_failed';
    throw err;
  }
  return res.json();
}

async function saveState(state) {
  const token = requireToken();
  await put(PATHNAME, JSON.stringify(state), {
    access: 'public',
    contentType: 'application/json; charset=utf-8',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    token,
  });
}

function sanitizeState(input, previous, { touchUpdatedAt = true } = {}) {
  const base = previous || { current: '', nextUp: [], timerEndsAt: null, onAir: false, updatedAt: Date.now() };
  const next = { ...base };
  if (typeof next.onAir !== 'boolean') next.onAir = false;

  if (typeof input?.current === 'string') next.current = input.current.slice(0, 200);
  if (Array.isArray(input?.nextUp)) {
    next.nextUp = input.nextUp
      .filter((x) => typeof x === 'string')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 25)
      .map((x) => x.slice(0, 200));
  }
  if (input && Object.prototype.hasOwnProperty.call(input, 'timerEndsAt')) {
    if (input.timerEndsAt === null) next.timerEndsAt = null;
    if (typeof input.timerEndsAt === 'number' && Number.isFinite(input.timerEndsAt)) {
      next.timerEndsAt = input.timerEndsAt > 10_000_000_000 ? input.timerEndsAt : input.timerEndsAt * 1000;
    }
  }
  if (typeof input?.onAir === 'boolean') next.onAir = input.onAir;

  if (touchUpdatedAt) {
    next.updatedAt = Date.now();
  } else if (typeof next.updatedAt !== 'number' || !Number.isFinite(next.updatedAt)) {
    next.updatedAt = Date.now();
  }
  return next;
}

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
    res.setHeader('access-control-allow-headers', 'content-type,x-admin-password');
    res.end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const stored = await loadState();
      if (!stored) return json(res, 200, { current: '', nextUp: [], timerEndsAt: null, onAir: false, updatedAt: Date.now() });
      return json(res, 200, sanitizeState(stored, null, { touchUpdatedAt: false }));
    } catch (e) {
      return json(res, 500, { error: e instanceof Error ? e.message : 'Failed to load state' });
    }
  }

  if (req.method === 'POST') {
    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword) return json(res, 500, { error: 'Server misconfigured: ADMIN_PASSWORD not set' });
    const provided = req.headers['x-admin-password'];
    if (!provided || provided !== expectedPassword) {
      return json(res, 401, { error: 'Unauthorized' });
    }

    try {
      const body = await readJsonBody(req);
      if (!body || typeof body !== 'object') return json(res, 400, { error: 'Invalid JSON body' });

      const previous = await loadState();
      const hasChanges = ['current', 'nextUp', 'timerEndsAt', 'onAir'].some((k) =>
        Object.prototype.hasOwnProperty.call(body, k),
      );
      if (!hasChanges) {
        return json(res, 200, previous || { current: '', nextUp: [], timerEndsAt: null, onAir: false, updatedAt: Date.now() });
      }
      const next = sanitizeState(body, previous);
      await saveState(next);
      return json(res, 200, next);
    } catch (e) {
      return json(res, 500, { error: e instanceof Error ? e.message : 'Failed to save state' });
    }
  }

  return json(res, 405, { error: 'Method Not Allowed' });
};

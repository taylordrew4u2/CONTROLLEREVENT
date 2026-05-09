const { put, list } = require('@vercel/blob');

const PATHNAME = 'controllerEvent/library.json';

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

function emptyLibrary() {
  return { performers: [], shows: [], settings: {}, updatedAt: Date.now() };
}

async function loadLibrary() {
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

async function saveLibrary(library) {
  const token = requireToken();
  await put(PATHNAME, JSON.stringify(library), {
    access: 'public',
    contentType: 'application/json; charset=utf-8',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    token,
  });
}

function sanitizeLibrary(input) {
  const out = emptyLibrary();
  if (input && typeof input === 'object') {
    if (Array.isArray(input.performers)) out.performers = input.performers;
    if (Array.isArray(input.shows)) out.shows = input.shows;
    if (input.settings && typeof input.settings === 'object' && !Array.isArray(input.settings)) {
      out.settings = input.settings;
    }
  }
  out.updatedAt = Date.now();
  return out;
}

function checkAuth(req) {
  const expected = process.env.ADMIN_PASSWORD || 'weed69';
  const provided = req.headers['x-admin-password'];
  return provided && provided === expected;
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

  if (!checkAuth(req)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const stored = await loadLibrary();
      if (!stored) return json(res, 200, emptyLibrary());
      return json(res, 200, {
        performers: Array.isArray(stored.performers) ? stored.performers : [],
        shows: Array.isArray(stored.shows) ? stored.shows : [],
        settings: stored.settings && typeof stored.settings === 'object' ? stored.settings : {},
        updatedAt: typeof stored.updatedAt === 'number' ? stored.updatedAt : Date.now(),
      });
    } catch (e) {
      return json(res, 500, { error: e instanceof Error ? e.message : 'Failed to load library' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return json(res, 400, { error: 'Invalid JSON body' });
      }
      const next = sanitizeLibrary(body);
      await saveLibrary(next);
      return json(res, 200, next);
    } catch (e) {
      return json(res, 500, { error: e instanceof Error ? e.message : 'Failed to save library' });
    }
  }

  return json(res, 405, { error: 'Method Not Allowed' });
};

const KEY = 'controllerEvent:state';

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

async function upstash(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    const err = new Error('Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN env vars.');
    err.code = 'missing_env';
    throw err;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `Upstash error (${res.status})`);
    err.code = 'upstash_error';
    throw err;
  }
  return data?.result;
}

function sanitizeState(input, previous) {
  const base = previous || { current: '', nextUp: [], timerEndsAt: null, updatedAt: Date.now() };
  const next = { ...base };

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
      // Guard against obviously wrong values (e.g. seconds)
      next.timerEndsAt = input.timerEndsAt > 10_000_000_000 ? input.timerEndsAt : input.timerEndsAt * 1000;
    }
  }

  next.updatedAt = Date.now();
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
      const raw = await upstash(['GET', KEY]);
      if (!raw) return json(res, 200, { current: '', nextUp: [], timerEndsAt: null, updatedAt: Date.now() });
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return json(res, 200, sanitizeState(parsed, null));
    } catch (e) {
      return json(res, 500, { error: e instanceof Error ? e.message : 'Failed to load state' });
    }
  }

  if (req.method === 'POST') {
    const expectedPassword = process.env.ADMIN_PASSWORD || 'weed69';
    const provided = req.headers['x-admin-password'];
    if (!provided || provided !== expectedPassword) {
      return json(res, 401, { error: 'Unauthorized' });
    }

    try {
      const body = await readJsonBody(req);
      if (!body || typeof body !== 'object') return json(res, 400, { error: 'Invalid JSON body' });

      const raw = await upstash(['GET', KEY]);
      const previous = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
      const next = sanitizeState(body, previous);
      await upstash(['SET', KEY, JSON.stringify(next)]);
      return json(res, 200, next);
    } catch (e) {
      return json(res, 500, { error: e instanceof Error ? e.message : 'Failed to save state' });
    }
  }

  return json(res, 405, { error: 'Method Not Allowed' });
};


const { put, del } = require('@vercel/blob');

const MAX_BYTES = 25 * 1024 * 1024;

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
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

function checkAuth(req) {
  const expected = process.env.ADMIN_PASSWORD || 'weed69';
  const provided = req.headers['x-admin-password'];
  return provided && provided === expected;
}

async function readRawBody(req, limit) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > limit) {
      const err = new Error('Payload too large');
      err.code = 'too_large';
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function safeFilename(name) {
  const cleaned = String(name || 'audio').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  return cleaned || 'audio';
}

function parseUrlParam(req) {
  try {
    const u = new URL(req.url, 'http://x');
    return u.searchParams.get('url');
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-methods', 'POST,DELETE,OPTIONS');
    res.setHeader('access-control-allow-headers', 'content-type,x-admin-password,x-filename');
    res.end();
    return;
  }

  if (!checkAuth(req)) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const token = requireToken();
      const filename = safeFilename(req.headers['x-filename'] || 'audio');
      const contentType = req.headers['content-type'] || 'application/octet-stream';
      const buffer = await readRawBody(req, MAX_BYTES);
      if (buffer.length === 0) return json(res, 400, { error: 'Empty body' });

      const id = `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const ext = (filename.includes('.') ? filename.split('.').pop() : '').toLowerCase().slice(0, 8);
      const pathname = ext ? `controllerEvent/audio/${id}.${ext}` : `controllerEvent/audio/${id}`;

      const result = await put(pathname, buffer, {
        access: 'public',
        contentType,
        addRandomSuffix: true,
        cacheControlMaxAge: 31536000,
        token,
      });

      return json(res, 200, {
        id,
        url: result.url,
        name: filename,
        size: buffer.length,
        contentType,
      });
    } catch (e) {
      if (e && e.code === 'too_large') return json(res, 413, { error: 'Payload too large (max 25MB)' });
      return json(res, 500, { error: e instanceof Error ? e.message : 'Upload failed' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const token = requireToken();
      const url = parseUrlParam(req);
      if (!url) return json(res, 400, { error: 'Missing url query param' });
      await del(url, { token });
      return json(res, 200, { ok: true });
    } catch (e) {
      return json(res, 500, { error: e instanceof Error ? e.message : 'Delete failed' });
    }
  }

  return json(res, 405, { error: 'Method Not Allowed' });
};

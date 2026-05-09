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

const SYSTEM_PROMPT = `You parse comedy/performance show lineups into JSON.
Given a free-form list of performer names with optional set durations, return an ordered array of items with fields "name" (string) and "duration" (integer minutes).
Rules:
- Preserve the order given.
- If a duration is missing, default to 5.
- If a duration looks like seconds or hours, convert to minutes (round to nearest integer, minimum 1).
- Strip bullet markers, numbering, "min"/"minutes" units, and surrounding punctuation from names.
- Skip header rows like "Name | Duration" and blank/comment lines.
- Never invent performers. Never merge two lines into one.
Return JSON only.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    entries: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          duration: { type: 'integer', minimum: 1, maximum: 240 },
        },
        required: ['name', 'duration'],
      },
    },
  },
  required: ['entries'],
};

function checkAuth(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return null;
  const provided = req.headers['x-admin-password'];
  return Boolean(provided && provided === expected);
}

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-methods', 'POST,OPTIONS');
    res.setHeader('access-control-allow-headers', 'content-type,x-admin-password');
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method Not Allowed' });
  }

  const auth = checkAuth(req);
  if (auth === null) return json(res, 500, { error: 'Server misconfigured: ADMIN_PASSWORD not set' });
  if (!auth) return json(res, 401, { error: 'Unauthorized' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json(res, 503, { error: 'AI parsing not configured (OPENAI_API_KEY missing)' });

  const body = await readJsonBody(req);
  const text = typeof body?.text === 'string' ? body.text : '';
  if (!text.trim()) return json(res, 400, { error: 'Empty text' });
  if (text.length > 20_000) return json(res, 413, { error: 'Text too long (max 20000 chars)' });

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'lineup', strict: true, schema: RESPONSE_SCHEMA },
        },
        temperature: 0,
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      return json(res, 502, { error: `OpenAI request failed (${r.status})`, details: errText.slice(0, 500) });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return json(res, 502, { error: 'OpenAI response missing content' });

    let parsed;
    try { parsed = JSON.parse(content); } catch {
      return json(res, 502, { error: 'OpenAI returned non-JSON content' });
    }

    const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
    const cleaned = entries
      .filter((e) => e && typeof e.name === 'string' && Number.isFinite(e.duration))
      .map((e) => ({
        name: String(e.name).trim().slice(0, 200),
        duration: Math.max(1, Math.min(240, Math.round(Number(e.duration)))),
      }))
      .filter((e) => e.name);

    return json(res, 200, { entries: cleaned });
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : 'Parse failed' });
  }
};

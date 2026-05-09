import type { ParsedLineupItem } from '../lineupParser';

export function makeWebLineupAi(password: string) {
  return async (text: string): Promise<ParsedLineupItem[]> => {
    const res = await fetch('/api/parse-lineup', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const msg = body && typeof body.error === 'string' ? body.error : `Parse failed (${res.status})`;
      throw new Error(msg);
    }
    const data = await res.json();
    if (!Array.isArray(data?.entries)) throw new Error('Parse response missing entries');
    return data.entries.filter(
      (e: unknown): e is ParsedLineupItem =>
        !!e && typeof (e as ParsedLineupItem).name === 'string' && Number.isFinite((e as ParsedLineupItem).duration),
    );
  };
}

export interface ParsedLineupItem {
  name: string;
  duration: number;
}

const DEFAULT_DURATION = 5;
const MAX_DURATION = 240;

function clampDuration(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_DURATION;
  return Math.min(Math.round(n), MAX_DURATION);
}

function stripBullet(line: string): string {
  return line.replace(/^[\s\-*•·–—]+/, '').replace(/^\d+[.)]\s+/, '');
}

function parseDurationToken(raw: string): number | null {
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|s|sec|secs|second|seconds)?$/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  const unit = (m[2] || 'm').toLowerCase();
  if (unit.startsWith('h')) return value * 60;
  if (unit.startsWith('s')) return value / 60;
  return value;
}

const SEPARATORS = ['\t', '|', ' - ', ' – ', ' — ', ': ', ', ', ',', ';'];

function splitNameDuration(line: string): { name: string; duration: number } {
  for (const sep of SEPARATORS) {
    const idx = line.lastIndexOf(sep);
    if (idx > 0) {
      const tail = line.slice(idx + sep.length).trim();
      const dur = parseDurationToken(tail);
      if (dur !== null) {
        return { name: line.slice(0, idx).trim(), duration: clampDuration(dur) };
      }
    }
  }

  const trailing = line.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours)?\s*$/i);
  if (trailing && trailing[1].trim()) {
    const dur = parseDurationToken(`${trailing[2]}${trailing[3] || ''}`);
    if (dur !== null) return { name: trailing[1].trim(), duration: clampDuration(dur) };
  }

  const parens = line.match(/^(.*?)\s*\((\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours)?\)\s*$/i);
  if (parens && parens[1].trim()) {
    const dur = parseDurationToken(`${parens[2]}${parens[3] || ''}`);
    if (dur !== null) return { name: parens[1].trim(), duration: clampDuration(dur) };
  }

  return { name: line.trim(), duration: DEFAULT_DURATION };
}

export function parseLineupText(text: string): ParsedLineupItem[] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => stripBullet(l).trim())
    .filter(Boolean);

  const items: ParsedLineupItem[] = [];
  for (const line of lines) {
    if (/^(name|performer|act|artist)\s*[\t,|].*duration|time/i.test(line)) continue;
    const { name, duration } = splitNameDuration(line);
    if (!name) continue;
    items.push({ name: name.slice(0, 200), duration });
  }
  return items;
}

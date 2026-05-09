import type { ParsedLineupItem } from './lineupParser';

export type LineupAiParser = (text: string) => Promise<ParsedLineupItem[]>;

let registered: LineupAiParser | null = null;

export function setLineupAiParser(fn: LineupAiParser | null): void {
  registered = fn;
}

export function getLineupAiParser(): LineupAiParser | null {
  return registered;
}

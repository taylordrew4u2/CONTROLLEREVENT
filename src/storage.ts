/**
 * Local-only storage layer.
 * All data persists in localStorage. IDs are auto-incremented integers.
 */

import { Performer, Show } from "./types";

function getStore<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setStore<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function nextId(key: string): number {
  const counterKey = `${key}_id`;
  const current = parseInt(localStorage.getItem(counterKey) || "0", 10);
  const next = current + 1;
  localStorage.setItem(counterKey, String(next));
  return next;
}

// ── Performers ─────────────────────────────────────────────

export function getPerformers(): Performer[] {
  return getStore<Performer>("performers");
}

export function addPerformer(performer: Performer): Performer {
  const list = getPerformers();
  const saved = { ...performer, id: nextId("performers") };
  list.push(saved);
  setStore("performers", list);
  return saved;
}

export function updatePerformer(id: number, performer: Performer): Performer {
  const list = getPerformers().map((p) =>
    p.id === id ? { ...performer, id } : p,
  );
  setStore("performers", list);
  return { ...performer, id };
}

export function deletePerformer(id: number): boolean {
  const list = getPerformers().filter((p) => p.id !== id);
  setStore("performers", list);
  return true;
}

// ── Shows ──────────────────────────────────────────────────

export function getShows(): Show[] {
  return getStore<Show>("shows");
}

export function getShow(id: number): Show | null {
  return getShows().find((s) => s.id === id) || null;
}

export function saveShow(show: Show): number {
  const list = getShows();
  const id = nextId("shows");
  list.push({ ...show, id });
  setStore("shows", list);
  return id;
}

export function updateShow(id: number, show: Show): number {
  const list = getShows().map((s) => (s.id === id ? { ...show, id } : s));
  setStore("shows", list);
  return id;
}

export function deleteShow(id: number): boolean {
  const list = getShows().filter((s) => s.id !== id);
  setStore("shows", list);
  return true;
}

// ── Backup & Restore ────────────────────────────

const BACKUP_KEYS = [
  "performers",
  "performers_id",
  "shows",
  "shows_id",
  "appSettings",
  "seeded",
];

export function exportAllData(): string {
  const data: Record<string, string | null> = {};
  for (const key of BACKUP_KEYS) {
    data[key] = localStorage.getItem(key);
  }
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): void {
  let data: Record<string, string | null>;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Invalid backup file — could not parse JSON");
  }
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid backup file — expected an object");
  }
  // Validate all values before writing anything (atomic-ish)
  const entries: [string, string][] = [];
  for (const key of BACKUP_KEYS) {
    if (key in data && data[key] !== null) {
      if (typeof data[key] !== "string") {
        throw new Error(`Invalid backup file — key "${key}" is not a string`);
      }
      entries.push([key, data[key] as string]);
    }
  }
  // All validation passed — write all at once
  for (const [key, value] of entries) {
    localStorage.setItem(key, value);
  }
}

// ── Seed data (first-launch only) ──────────────────────────

export function seedIfEmpty(): void {
  if (localStorage.getItem("seeded")) return;

  // Seed example performers
  if (getPerformers().length === 0) {
    const examples: Omit<Performer, "id">[] = [
      { name: "Example - Opener 1", defaultDuration: 8 },
      { name: "Example - Opener 2", defaultDuration: 8 },
      { name: "Example - Opener 3", defaultDuration: 8 },
      { name: "Example - Headliner", defaultDuration: 15 },
    ];
    for (const p of examples) {
      addPerformer(p as Performer);
    }
  }

  localStorage.setItem("seeded", "1");
}

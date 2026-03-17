/**
 * Local-only storage layer replacing Electron/SQLite.
 * All data persists in localStorage. IDs are auto-incremented integers.
 */

import {
  Comedian,
  Template,
  ShowTemplate,
  ShowTemplateSegment,
  Show,
} from "./types";

function getStore<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
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

// ── Comedians ──────────────────────────────────────────────

export function getComedians(): Comedian[] {
  return getStore<Comedian>("comedians");
}

export function addComedian(comedian: Comedian): Comedian {
  const list = getComedians();
  const saved = { ...comedian, id: nextId("comedians") };
  list.push(saved);
  setStore("comedians", list);
  return saved;
}

export function updateComedian(id: number, comedian: Comedian): Comedian {
  const list = getComedians().map((c) =>
    c.id === id ? { ...comedian, id } : c,
  );
  setStore("comedians", list);
  return { ...comedian, id };
}

export function deleteComedian(id: number): boolean {
  const list = getComedians().filter((c) => c.id !== id);
  setStore("comedians", list);
  return true;
}

// ── Templates ──────────────────────────────────────────────

export function getTemplates(): Template[] {
  return getStore<Template>("templates");
}

export function addTemplate(template: Template): Template {
  const list = getTemplates();
  const saved = { ...template, id: nextId("templates") };
  list.push(saved);
  setStore("templates", list);
  return saved;
}

export function updateTemplate(id: number, template: Template): Template {
  const list = getTemplates().map((t) =>
    t.id === id ? { ...template, id } : t,
  );
  setStore("templates", list);
  return { ...template, id };
}

export function deleteTemplate(id: number): boolean {
  const list = getTemplates().filter((t) => t.id !== id);
  setStore("templates", list);
  return true;
}

// ── Show Templates ─────────────────────────────────────────

export function getDefaultShowTemplate(): ShowTemplate | null {
  const list = getStore<ShowTemplate>("showTemplates");
  return list.find((t) => t.isDefault === 1) || null;
}

export function saveShowTemplate(
  name: string,
  segments: ShowTemplateSegment[],
): number {
  const list = getStore<ShowTemplate>("showTemplates");
  // clear existing defaults
  list.forEach((t) => (t.isDefault = 0));
  const id = nextId("showTemplates");
  list.push({
    id,
    name,
    isDefault: 1,
    createdDate: new Date().toISOString(),
    segments,
  });
  setStore("showTemplates", list);
  return id;
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

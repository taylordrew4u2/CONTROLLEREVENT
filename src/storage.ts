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

// ── Backup & Restore ────────────────────────────

const BACKUP_KEYS = [
  "comedians",
  "comedians_id",
  "templates",
  "templates_id",
  "showTemplates",
  "showTemplates_id",
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
  const data: Record<string, string | null> = JSON.parse(json);
  for (const key of BACKUP_KEYS) {
    if (key in data && data[key] !== null) {
      localStorage.setItem(key, data[key] as string);
    }
  }
}

// ── Seed data (first-launch only) ──────────────────────────

export function seedIfEmpty(): void {
  if (localStorage.getItem("seeded")) return;

  // Seed segment templates
  if (getTemplates().length === 0) {
    const defaultTemplates: Omit<Template, "id">[] = [
      { name: "Host Intro", type: "Host Intro", defaultDuration: 5 },
      { name: "Opening Act", type: "Opening Act", defaultDuration: 8 },
      { name: "Host Transition", type: "Host Transition", defaultDuration: 1 },
      {
        name: "Extended Host Bit",
        type: "Extended Host Bit",
        defaultDuration: 11,
      },
      { name: "Headliner Intro", type: "Headliner Intro", defaultDuration: 1 },
      { name: "Headliner Set", type: "Headliner Set", defaultDuration: 15 },
      { name: "Show Close", type: "Show Close", defaultDuration: 2 },
    ];
    for (const t of defaultTemplates) {
      addTemplate(t as Template);
    }
  }

  // Seed example comedians
  if (getComedians().length === 0) {
    const exampleComedians: Omit<Comedian, "id">[] = [
      { name: "Example - Opener 1", defaultDuration: 8 },
      { name: "Example - Opener 2", defaultDuration: 8 },
      { name: "Example - Opener 3", defaultDuration: 8 },
      { name: "Example - Headliner", defaultDuration: 15 },
    ];
    for (const c of exampleComedians) {
      addComedian(c as Comedian);
    }
  }

  // Seed 60-min default show template
  if (!getDefaultShowTemplate()) {
    saveShowTemplate("Standard 60-Min Show", [
      { name: "Show Open + Host Intro", duration: 5, orderIndex: 0 },
      { name: "Opening Act 1", duration: 8, orderIndex: 1 },
      { name: "Host Transition", duration: 1, orderIndex: 2 },
      { name: "Opening Act 2", duration: 8, orderIndex: 3 },
      { name: "Host Transition", duration: 1, orderIndex: 4 },
      { name: "Opening Act 3", duration: 8, orderIndex: 5 },
      { name: "Extended Host Bit", duration: 11, orderIndex: 6 },
      { name: "Headliner Intro", duration: 1, orderIndex: 7 },
      { name: "Headliner Set", duration: 15, orderIndex: 8 },
      { name: "Show Close", duration: 2, orderIndex: 9 },
    ]);
  }

  localStorage.setItem("seeded", "1");
}

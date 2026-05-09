import { Performer, Show } from '../types';

export interface RemoteLibrary {
  performers: Performer[];
  shows: Show[];
  settings: Record<string, unknown>;
  updatedAt: number;
}

const SYNC_KEYS = ['performers', 'shows', 'appSettings'] as const;

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  if (res.status === 401) return 'Unauthorized';
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const data = await res.json().catch(() => null);
    if (data && typeof data === 'object' && 'error' in data && typeof (data as { error?: unknown }).error === 'string') {
      return (data as { error: string }).error;
    }
  }
  const text = await res.text().catch(() => '');
  return text || `${fallback} (${res.status})`;
}

export async function fetchRemoteLibrary(password: string): Promise<RemoteLibrary> {
  const res = await fetch('/api/library', {
    method: 'GET',
    headers: { 'x-admin-password': password },
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, 'Failed to load library'));
  return res.json();
}

export async function pushRemoteLibrary(password: string, lib: RemoteLibrary): Promise<RemoteLibrary> {
  const res = await fetch('/api/library', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-password': password },
    body: JSON.stringify(lib),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, 'Failed to save library'));
  return res.json();
}

export function readLocalLibrary(): RemoteLibrary {
  let performers: Performer[] = [];
  let shows: Show[] = [];
  let settings: Record<string, unknown> = {};
  try { performers = JSON.parse(localStorage.getItem('performers') || '[]'); } catch { /* ignore */ }
  try { shows = JSON.parse(localStorage.getItem('shows') || '[]'); } catch { /* ignore */ }
  try { settings = JSON.parse(localStorage.getItem('appSettings') || '{}'); } catch { /* ignore */ }
  return { performers, shows, settings, updatedAt: Date.now() };
}

export function hydrateFromRemote(lib: RemoteLibrary): void {
  localStorage.setItem('performers', JSON.stringify(lib.performers || []));
  localStorage.setItem('shows', JSON.stringify(lib.shows || []));
  localStorage.setItem('appSettings', JSON.stringify(lib.settings || {}));

  const perfMaxId = (lib.performers || []).reduce((m, p) => Math.max(m, p.id || 0), 0);
  const showMaxId = (lib.shows || []).reduce((m, s) => Math.max(m, s.id || 0), 0);
  localStorage.setItem('performers_id', String(perfMaxId));
  localStorage.setItem('shows_id', String(showMaxId));
  localStorage.setItem('seeded', '1');
}

export async function hydrateAdmin(password: string): Promise<RemoteLibrary> {
  const lib = await fetchRemoteLibrary(password);
  hydrateFromRemote(lib);
  return lib;
}

export interface SyncInstaller {
  uninstall: () => void;
}

export interface SyncCallbacks {
  onPushStart?: () => void;
  onPushSuccess?: () => void;
  onPushError?: (err: Error) => void;
}

/**
 * Wrap localStorage.setItem to push library changes to the server (debounced).
 * Returns an uninstaller that restores the original setItem.
 */
export function installSyncWriter(password: string, cb: SyncCallbacks = {}): SyncInstaller {
  const original = Storage.prototype.setItem;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight: Promise<void> | null = null;
  let rerun = false;

  const doFlush = async (): Promise<void> => {
    try {
      cb.onPushStart?.();
      await pushRemoteLibrary(password, readLocalLibrary());
      cb.onPushSuccess?.();
    } catch (err) {
      cb.onPushError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const flush = () => {
    timer = null;
    if (inFlight) {
      rerun = true;
      return;
    }
    inFlight = (async () => {
      try {
        do {
          rerun = false;
          await doFlush();
        } while (rerun);
      } finally {
        inFlight = null;
      }
    })();
  };

  function patched(this: Storage, key: string, value: string) {
    original.call(this, key, value);
    if (this !== window.localStorage) return;
    if ((SYNC_KEYS as readonly string[]).includes(key)) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, 500);
    }
  }

  Storage.prototype.setItem = patched as typeof Storage.prototype.setItem;

  return {
    uninstall: () => {
      if (timer) clearTimeout(timer);
      Storage.prototype.setItem = original;
    },
  };
}

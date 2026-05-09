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
  const remote = await fetchRemoteLibrary(password);
  const local = readLocalLibrary();

  const remoteEmpty =
    (remote.performers?.length || 0) === 0 && (remote.shows?.length || 0) === 0;
  const localHasData = local.performers.length > 0 || local.shows.length > 0;

  // Don't let an empty server clobber locally-saved shows/performers.
  // This protects against the race where a save was made but the debounced
  // push hadn't fired before the next hydrate (page reload, re-unlock, etc.).
  if (remoteEmpty && localHasData) {
    const pushed = await pushRemoteLibrary(password, local);
    return pushed;
  }

  hydrateFromRemote(remote);
  return remote;
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

  // Cancel the debounce and flush immediately when the tab is hidden or
  // unloaded so locally-saved data isn't lost if the user closes/refreshes
  // before the 500ms debounce fires. fetch with keepalive: true survives
  // unload and lets us keep the password in a header (not the URL).
  const flushNowKeepalive = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    try {
      void fetch('/api/library', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(readLocalLibrary()),
        keepalive: true,
      });
    } catch {
      flush();
    }
  };

  const onPageHide = () => {
    if (timer) flushNowKeepalive();
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden' && timer) flushNowKeepalive();
  };

  window.addEventListener('pagehide', onPageHide);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    uninstall: () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      Storage.prototype.setItem = original;
    },
  };
}

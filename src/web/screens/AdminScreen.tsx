import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import LibraryScreen from '../../screens/LibraryScreen';
import ShowBuilderScreen from '../../screens/ShowBuilderScreen';
import LiveControllerScreen from '../../screens/LiveControllerScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import ToastContainer from '../../components/Toast';
import { hydrateAdmin, installSyncWriter } from '../librarySync';
import { setWebAudioSaver } from '../../audioStorage';
import { makeWebAudioSaver } from '../webAudioSaver';
import { updateEventState } from '../api';
import '../../App.css';

const SESSION_KEY = 'pn_admin_password';
const UNLOCKED_KEY = 'pn_admin_unlocked';

function NavIcon({ type }: { type: 'library' | 'builder' | 'live' | 'settings' }) {
  const props = { width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'library':
      return <svg {...props} viewBox="0 0 22 22"><line x1="4" y1="6" x2="18" y2="6"/><line x1="4" y1="11" x2="18" y2="11"/><line x1="4" y1="16" x2="18" y2="16"/></svg>;
    case 'builder':
      return <svg {...props} viewBox="0 0 22 22"><rect x="3" y="3" width="6.5" height="6.5" rx="1.5"/><rect x="12.5" y="3" width="6.5" height="6.5" rx="1.5"/><rect x="3" y="12.5" width="6.5" height="6.5" rx="1.5"/><rect x="12.5" y="12.5" width="6.5" height="6.5" rx="1.5"/></svg>;
    case 'live':
      return <svg {...props} viewBox="0 0 22 22"><circle cx="11" cy="11" r="8"/><path d="M9 7L16 11L9 15Z" fill="currentColor" stroke="none"/></svg>;
    case 'settings':
      return <svg {...props} viewBox="0 0 22 22"><line x1="4" y1="7.5" x2="18" y2="7.5"/><circle cx="8" cy="7.5" r="2.5" fill="currentColor"/><line x1="4" y1="14.5" x2="18" y2="14.5"/><circle cx="14" cy="14.5" r="2.5" fill="currentColor"/></svg>;
  }
}

function PasswordGate({ onUnlock }: { onUnlock: (password: string) => void }) {
  const [password, setPassword] = useState(() => sessionStorage.getItem(SESSION_KEY) || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Enter password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-password': password },
        body: '{}',
      });
      if (res.status === 401) { setError('Wrong password.'); return; }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setError(text || `Auth failed (${res.status})`);
        return;
      }
      sessionStorage.setItem(SESSION_KEY, password);
      sessionStorage.setItem(UNLOCKED_KEY, '1');
      onUnlock(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="web-shell">
      <div className="web-topbar">
        <div className="web-brand">Pins & Needles Live</div>
      </div>
      <div className="web-page">
        <div className="web-card">
          <div className="web-label">Admin Login</div>
          <form onSubmit={handle} className="web-form">
            <label className="web-field">
              <div className="web-field-label">Password</div>
              <input
                className="web-input"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
            </label>
            <div className="web-actions">
              <button className="web-btn" type="submit" disabled={busy || !password}>
                {busy ? 'Checking…' : 'Unlock'}
              </button>
            </div>
            {error ? <div className="web-message">{error}</div> : null}
          </form>
        </div>
      </div>
    </div>
  );
}

interface ShellProps {
  password: string;
  onLock: () => void;
}

function AdminShell({ password, onLock }: ShellProps) {
  const [hydrated, setHydrated] = useState(false);
  const [hydrateError, setHydrateError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const lastPublishRef = useRef<string>('');

  // Hydrate library from server, install sync writer + audio uploader.
  useEffect(() => {
    let cancelled = false;
    setWebAudioSaver(makeWebAudioSaver(password));
    hydrateAdmin(password)
      .then(() => { if (!cancelled) setHydrated(true); })
      .catch((err) => {
        if (!cancelled) {
          setHydrateError(err instanceof Error ? err.message : 'Failed to load library');
          if (/unauthorized/i.test(String(err))) onLock();
        }
      });

    const installer = installSyncWriter(password, {
      onPushStart: () => { setSyncing(true); setSyncError(null); },
      onPushSuccess: () => { setSyncing(false); },
      onPushError: (err) => {
        setSyncing(false);
        setSyncError(err.message);
        if (/unauthorized/i.test(err.message)) onLock();
      },
    });

    return () => {
      cancelled = true;
      installer.uninstall();
      setWebAudioSaver(null);
    };
  }, [password, onLock]);

  // Relay LiveController state to the public /api/state blob.
  const publish = useCallback(async (detail: { current: string; nextUp: string[]; timerEndsAt: number | null }) => {
    const key = JSON.stringify(detail);
    if (key === lastPublishRef.current) return;
    lastPublishRef.current = key;
    try {
      await updateEventState(password, detail);
    } catch (err) {
      if (err instanceof Error && /unauthorized/i.test(err.message)) onLock();
    }
  }, [password, onLock]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ current: string; nextUp: string[]; timerEndsAt: number | null }>;
      if (ce.detail) publish(ce.detail);
    };
    window.addEventListener('pn:live-state', handler);
    return () => window.removeEventListener('pn:live-state', handler);
  }, [publish]);

  if (!hydrated) {
    return (
      <div className="web-shell">
        <div className="web-topbar">
          <div className="web-brand">Pins & Needles Live</div>
        </div>
        <div className="web-page">
          <div className="web-card">
            <div className="web-label">Loading library…</div>
            {hydrateError ? <div className="web-message">{hydrateError}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="app-nav">
        <h1>P&N Controller</h1>
        <div className="nav-links">
          <NavLink to="library" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><NavIcon type="library" /></span>
            <span className="nav-label">Library</span>
          </NavLink>
          <NavLink to="builder" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><NavIcon type="builder" /></span>
            <span className="nav-label">Builder</span>
          </NavLink>
          <NavLink to="live" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><NavIcon type="live" /></span>
            <span className="nav-label">Live</span>
          </NavLink>
          <NavLink to="settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><NavIcon type="settings" /></span>
            <span className="nav-label">Settings</span>
          </NavLink>
          <button
            className="nav-link"
            type="button"
            onClick={onLock}
            style={{ marginTop: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'inherit', font: 'inherit' }}
          >
            <span className="nav-label">Lock</span>
          </button>
        </div>
      </nav>

      <div className="app-content">
        <div className="admin-sync-status" style={{ position: 'fixed', top: 8, right: 12, zIndex: 50, fontSize: 12 }}>
          {syncing ? <span style={{ color: 'rgba(255,255,255,0.7)' }}>Syncing…</span> : null}
          {syncError ? <span style={{ color: '#ff8a8a' }}>Sync failed: {syncError}</span> : null}
        </div>
        <Routes>
          <Route index element={<Navigate to="library" replace />} />
          <Route path="library" element={<LibraryScreen />} />
          <Route path="builder" element={<ShowBuilderScreen />} />
          <Route path="live" element={<LiveControllerScreen />} />
          <Route path="settings" element={<SettingsScreen onSettingsChange={() => {}} />} />
          <Route path="*" element={<Navigate to="library" replace />} />
        </Routes>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function AdminScreen() {
  const [password, setPassword] = useState<string | null>(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    const unlocked = sessionStorage.getItem(UNLOCKED_KEY) === '1';
    return unlocked && stored ? stored : null;
  });

  const handleLock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(UNLOCKED_KEY);
    setPassword(null);
  }, []);

  if (!password) {
    return <PasswordGate onUnlock={(pw) => setPassword(pw)} />;
  }
  return <AdminShell password={password} onLock={handleLock} />;
}

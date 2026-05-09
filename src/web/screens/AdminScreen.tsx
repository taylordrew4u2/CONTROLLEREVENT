import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EventState, fetchEventState, updateEventState } from '../api';

const SESSION_KEY = 'pn_admin_password';
const UNLOCKED_KEY = 'pn_admin_unlocked';

function parseNextUp(text: string) {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
}

export default function AdminScreen() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(SESSION_KEY) || '');
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCKED_KEY) === '1');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [state, setState] = useState<EventState | null>(null);
  const [current, setCurrent] = useState('');
  const [nextUpText, setNextUpText] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('8');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [initialLoadSucceeded, setInitialLoadSucceeded] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (syncInputs: boolean) => {
    const next = await fetchEventState();
    setState(next);
    if (syncInputs || !initialLoadSucceeded) {
      setCurrent(next.current || '');
      setNextUpText((next.nextUp || []).join('\n'));
      if (!initialLoadSucceeded) {
        setInitialLoadSucceeded(true);
      }
    }
  }, [initialLoadSucceeded]);

  useEffect(() => {
    if (!unlocked) return;
    load(true).catch(() => {});
    pollRef.current = setInterval(() => load(false).catch(() => {}), 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load, unlocked]);

  const remaining = useMemo(() => {
    if (!state?.timerEndsAt) return null;
    return state.timerEndsAt - Date.now();
  }, [state?.timerEndsAt]);

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) {
      setAuthError('Enter password.');
      return;
    }
    setAuthBusy(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-password': password },
        body: '{}',
      });
      if (res.status === 401) {
        setAuthError('Wrong password.');
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setAuthError(text || `Auth failed (${res.status})`);
        return;
      }
      sessionStorage.setItem(SESSION_KEY, password);
      sessionStorage.setItem(UNLOCKED_KEY, '1');
      setUnlocked(true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Auth failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(UNLOCKED_KEY);
    setPassword('');
    setUnlocked(false);
    setState(null);
    setInitialLoadSucceeded(false);
  };

  const doUpdate = async (next: Partial<Pick<EventState, 'current' | 'nextUp' | 'timerEndsAt'>>) => {
    setBusy(true);
    try {
      const updated = await updateEventState(password, next);
      setState(updated);
      setCurrent(updated.current || '');
      setNextUpText((updated.nextUp || []).join('\n'));
      setMessage('Saved.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setMessage(msg);
      if (/unauthorized/i.test(msg)) {
        handleLock();
      }
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    doUpdate({
      current: current.trim(),
      nextUp: parseNextUp(nextUpText),
    });
  };

  const onStartTimer = () => {
    const mins = Number(durationMinutes);
    if (!Number.isFinite(mins) || mins <= 0) {
      setMessage('Enter a valid duration (minutes).');
      return;
    }
    doUpdate({
      current: current.trim(),
      nextUp: parseNextUp(nextUpText),
      timerEndsAt: Date.now() + mins * 60 * 1000,
    });
  };

  const onStopTimer = () => {
    doUpdate({ timerEndsAt: null });
  };

  if (!unlocked) {
    return (
      <div className="web-page">
        <div className="web-card">
          <div className="web-label">Admin Login</div>
          <form onSubmit={handleUnlock} className="web-form">
            <label className="web-field">
              <div className="web-field-label">Password</div>
              <input
                className="web-input"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={authBusy}
              />
            </label>
            <div className="web-actions">
              <button className="web-btn" type="submit" disabled={authBusy || !password}>
                {authBusy ? 'Checking…' : 'Unlock'}
              </button>
            </div>
            {authError ? <div className="web-message">{authError}</div> : null}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="web-page">
      <div className="web-card">
        <div className="web-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="web-label">Admin</div>
          <button className="web-btn secondary" type="button" onClick={handleLock}>Lock</button>
        </div>

        <form onSubmit={onSave} className="web-form">
          <label className="web-field">
            <div className="web-field-label">Now</div>
            <input
              className="web-input"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Current performer / segment"
            />
          </label>

          <label className="web-field">
            <div className="web-field-label">Next Up (one per line)</div>
            <textarea
              className="web-textarea"
              value={nextUpText}
              onChange={(e) => setNextUpText(e.target.value)}
              rows={6}
              placeholder="Next performer\nAfter that\n..."
            />
          </label>

          <div className="web-actions">
            <button className="web-btn" type="submit" disabled={busy}>Save Now/Next</button>
          </div>
        </form>

        <div className="web-divider" />

        <div className="web-row">
          <label className="web-field inline">
            <div className="web-field-label">Timer duration (min)</div>
            <input
              className="web-input"
              inputMode="numeric"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </label>
          <div className="web-actions">
            <button className="web-btn" type="button" onClick={onStartTimer} disabled={busy}>Start / Restart Timer</button>
            <button className="web-btn secondary" type="button" onClick={onStopTimer} disabled={busy}>Stop Timer</button>
          </div>
        </div>

        <div className="web-small">
          {state?.timerEndsAt
            ? `Timer running${remaining !== null ? ` (${Math.max(0, Math.ceil(remaining / 1000))}s remaining)` : ''}`
            : 'Timer stopped'}
        </div>

        {message ? <div className="web-message">{message}</div> : null}
      </div>
    </div>
  );
}

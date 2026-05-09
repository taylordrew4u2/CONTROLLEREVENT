import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EventState, fetchEventState, updateEventState } from '../api';

const SESSION_KEY = 'pn_admin_password';

function parseNextUp(text: string) {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
}

export default function AdminScreen() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(SESSION_KEY) || '');
  const [state, setState] = useState<EventState | null>(null);
  const [current, setCurrent] = useState('');
  const [nextUpText, setNextUpText] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('8');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (syncInputs: boolean) => {
    const next = await fetchEventState();
    setState(next);
    if (syncInputs) {
      setCurrent(next.current || '');
      setNextUpText((next.nextUp || []).join('\n'));
    }
  }, []);

  useEffect(() => {
    load(true).catch(() => {});
    pollRef.current = setInterval(() => load(false).catch(() => {}), 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  const remaining = useMemo(() => {
    if (!state?.timerEndsAt) return null;
    return state.timerEndsAt - Date.now();
  }, [state?.timerEndsAt]);

  const savePassword = (value: string) => {
    setPassword(value);
    sessionStorage.setItem(SESSION_KEY, value);
  };

  const doUpdate = async (next: Partial<Pick<EventState, 'current' | 'nextUp' | 'timerEndsAt'>>) => {
    if (!password) {
      setMessage('Enter admin password first.');
      return;
    }
    setBusy(true);
    try {
      const updated = await updateEventState(password, next);
      setState(updated);
      setCurrent(updated.current || '');
      setNextUpText((updated.nextUp || []).join('\n'));
      setMessage('Saved.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed');
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

  return (
    <div className="web-page">
      <div className="web-card">
        <div className="web-label">Admin</div>

        <div className="web-row">
          <label className="web-field">
            <div className="web-field-label">Password</div>
            <input
              className="web-input"
              type="password"
              value={password}
              onChange={(e) => savePassword(e.target.value)}
              placeholder="weed69"
            />
          </label>
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

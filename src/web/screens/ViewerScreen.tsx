import { useEffect, useMemo, useRef, useState } from 'react';
import { EventState, fetchEventState } from '../api';

function formatRemaining(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function ViewerScreen() {
  const [state, setState] = useState<EventState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const next = await fetchEventState();
        if (!cancelled) {
          setState(next);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      }
    };

    load();
    pollRef.current = setInterval(load, 1000);
    clockRef.current = setInterval(() => setNow(Date.now()), 250);

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      if (clockRef.current) clearInterval(clockRef.current);
    };
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!state?.timerEndsAt) return null;
    return (state.timerEndsAt - now) / 1000;
  }, [state?.timerEndsAt, now]);

  return (
    <div className="web-page">
      <div className="web-card">
        <div className="web-label">Now</div>
        <div className="web-now">{state?.current || '—'}</div>

        <div className="web-timer">
          {remainingSeconds === null ? (
            <div className="web-timer-idle">Timer not running</div>
          ) : (
            <div className={`web-timer-value${remainingSeconds <= 0 ? ' done' : ''}`}>
              {formatRemaining(remainingSeconds)}
            </div>
          )}
        </div>

        <div className="web-label">Next Up</div>
        <div className="web-next">
          {(state?.nextUp?.length ? state.nextUp : ['—']).map((name, idx) => (
            <div key={`${idx}-${name}`} className="web-next-item">{name}</div>
          ))}
        </div>

        {error ? <div className="web-error">{error}</div> : null}
      </div>
    </div>
  );
}


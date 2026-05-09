export type EventState = {
  current: string;
  nextUp: string[];
  timerEndsAt: number | null;
  updatedAt: number;
};

export async function fetchEventState(): Promise<EventState> {
  const res = await fetch('/api/state', { method: 'GET' });
  if (!res.ok) throw new Error(`Failed to load state (${res.status})`);
  return res.json();
}

export async function updateEventState(
  password: string,
  next: Partial<Pick<EventState, 'current' | 'nextUp' | 'timerEndsAt'>>
): Promise<EventState> {
  const res = await fetch('/api/state', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-password': password,
    },
    body: JSON.stringify(next),
  });
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await res.json().catch(() => null);
      if (
        data &&
        typeof data === 'object' &&
        'error' in data &&
        typeof data.error === 'string' &&
        data.error
      ) {
        throw new Error(data.error);
      }
    }
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to update state (${res.status})`);
  }
  return res.json();
}

import { useEffect, useState } from 'react';

// Ticks down to a target timestamp rather than naively decrementing once per
// second, so it stays accurate even if the tab is backgrounded/throttled
// (same approach as SessionTimeoutModal's session-expiry countdown).
export function useCountdown() {
  const [targetMs, setTargetMs] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (targetMs === null) return;
    let interval: ReturnType<typeof setInterval>;
    const tick = () => {
      const remaining = Math.max(0, Math.round((targetMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    };
    tick();
    interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  function start(seconds: number) {
    setTargetMs(Date.now() + seconds * 1000);
  }

  return { secondsLeft, start };
}

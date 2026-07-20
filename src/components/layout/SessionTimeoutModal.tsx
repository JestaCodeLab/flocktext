import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extendSession, logout as logoutApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { decodeJwtExpMs } from '@/lib/jwt';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const WARNING_WINDOW_MS = 5 * 60 * 1000;

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SessionTimeoutModal() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const clear = useAuthStore((s) => s.clear);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [staying, setStaying] = useState(false);
  const loggedOutRef = useRef(false);

  function forceLogout() {
    if (loggedOutRef.current) return;
    loggedOutRef.current = true;
    clear();
    navigate('/login', { replace: true });
  }

  // The access token's own expiry is the session's true absolute cap - the
  // server never extends it on a silent background refresh (see
  // api/services/session.js), only on the explicit "stay signed in" call
  // below. Timing off the refresh token instead would show a countdown to
  // the wrong (much later) deadline and let the session die out from under
  // the user without warning.
  useEffect(() => {
    setSecondsLeft(null);
    setDismissed(false);
    loggedOutRef.current = false;
    if (!accessToken) return;

    const expMs = decodeJwtExpMs(accessToken);
    if (!expMs) return;

    const warnInMs = expMs - WARNING_WINDOW_MS - Date.now();
    let tickInterval: ReturnType<typeof setInterval> | undefined;

    const warningTimer = setTimeout(() => {
      setDismissed(false);
      setSecondsLeft(Math.max(0, Math.round((expMs - Date.now()) / 1000)));
      tickInterval = setInterval(() => {
        const remaining = Math.round((expMs - Date.now()) / 1000);
        if (remaining <= 0) {
          if (tickInterval) clearInterval(tickInterval);
          forceLogout();
          return;
        }
        setSecondsLeft(remaining);
      }, 1000);
    }, Math.max(0, warnInMs));

    return () => {
      clearTimeout(warningTimer);
      if (tickInterval) clearInterval(tickInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleStay() {
    if (!refreshToken) return forceLogout();
    setStaying(true);
    try {
      const data = await extendSession(refreshToken);
      setTokens(data.accessToken, data.refreshToken);
    } catch {
      forceLogout();
    } finally {
      setStaying(false);
    }
  }

  async function handleLogoutNow() {
    if (refreshToken) {
      try {
        await logoutApi(refreshToken);
      } catch {
        // best-effort - proceed with local logout regardless
      }
    }
    forceLogout();
  }

  const open = secondsLeft !== null && !dismissed;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) setDismissed(true); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>You'll be signed out soon</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          For your security, you'll be signed out in{' '}
          <span className="font-semibold text-foreground">{formatCountdown(secondsLeft ?? 0)}</span>. Stay signed in to continue.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleLogoutNow}>
            Log out
          </Button>
          <Button disabled={staying} onClick={handleStay}>
            {staying ? 'Staying signed in…' : 'Stay signed in'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

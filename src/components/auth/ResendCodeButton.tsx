import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useCountdown } from '@/hooks/useCountdown';
import { apiErrorMessage } from '@/api/client';

const RESEND_COOLDOWN_SECONDS = 5 * 60;

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Starts counting down as soon as it mounts (a code was just sent to reach
// this screen), and again after each successful resend, so a phone number
// can't be spammed with codes. Shared by OtpPage and ForgotPasswordPage's
// verify-code step - `onResend` is whichever endpoint re-issues that flow's code.
export function ResendCodeButton({ onResend }: { onResend: () => Promise<unknown> }) {
  const { secondsLeft, start } = useCountdown();
  const [sending, setSending] = useState(false);

  useEffect(() => {
    start(RESEND_COOLDOWN_SECONDS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResend() {
    setSending(true);
    try {
      await onResend();
      toast.success('Code resent.');
      start(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  if (secondsLeft > 0) {
    return <div className="text-center text-[13px] text-muted-foreground">Resend code in {formatCountdown(secondsLeft)}</div>;
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={sending}
      className="block w-full text-center text-[13px] font-semibold text-primary hover:underline disabled:opacity-60"
    >
      {sending ? 'Resending…' : 'Resend code'}
    </button>
  );
}

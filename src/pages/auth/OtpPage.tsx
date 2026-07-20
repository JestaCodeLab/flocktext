import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/pages/auth/AuthLayout';
import * as authApi from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { apiErrorMessage } from '@/api/client';
import { normalizePhone } from '@/lib/phone';

export function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const phone = (location.state as { phone?: string } | null)?.phone ?? '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  if (!phone) {
    navigate('/signup', { replace: true });
    return null;
  }

  function updateDigit(index: number, value: string) {
    const char = value.slice(-1);
    setDigits((d) => {
      const next = [...d];
      next[index] = char;
      return next;
    });
    if (char && index < 5) inputs.current[index + 1]?.focus();
  }

  async function handleConfirm() {
    const code = digits.join('');
    if (code.length < 6) {
      toast.error('Enter all 6 digits of the code sent to your phone.');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.verifyOtp(normalizePhone(phone), code);
      setSession({ user: data.user, organization: data.organization }, data.accessToken, data.refreshToken);
      toast.success('Phone verified.');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Incorrect code.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <div className="mb-1 text-center text-[26px] font-bold lg:text-left">Verify your phone</div>
      <div className="mb-7 text-center text-sm leading-relaxed text-muted-foreground lg:text-left">Enter the 6-digit code sent to {phone}.</div>

      <div className="mb-6 flex gap-2.5">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => updateDigit(i, e.target.value)}
            className="w-full rounded-2xl border border-border bg-background py-3 text-center text-[22px] font-bold text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-3 focus:ring-ring/50"
          />
        ))}
      </div>

      <Button className="mb-4 h-12 w-full rounded-full" size="lg" onClick={handleConfirm} disabled={loading}>
        {loading ? 'Verifying…' : 'Confirm code'}
      </Button>
      <div className="text-center text-[13px] text-muted-foreground">Resend code</div>
    </AuthLayout>
  );
}

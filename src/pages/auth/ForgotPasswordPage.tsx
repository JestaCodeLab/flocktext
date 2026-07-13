import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/pages/auth/AuthLayout';
import * as authApi from '@/api/auth';
import { apiErrorMessage } from '@/api/client';
import { formatPhoneInput, normalizePhone } from '@/lib/phone';

type Step = 1 | 2 | 3 | 4;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  async function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    try {
      await authApi.forgotPasswordRequest(normalizePhone(phone));
      toast.success('Verification code sent.');
      setStep(2);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
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

  async function submitOtp() {
    const code = digits.join('');
    if (code.length < 6) {
      toast.error('Enter all 6 digits of the code.');
      return;
    }
    setLoading(true);
    try {
      const { resetToken } = await authApi.forgotPasswordVerify(normalizePhone(phone), code);
      setResetToken(resetToken);
      setStep(3);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Incorrect code.'));
    } finally {
      setLoading(false);
    }
  }

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPasswordReset(resetToken, newPassword);
      setStep(4);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {step < 4 && (
        <div className="mb-7 flex items-center gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={submitPhone}>
          <div className="mb-1 text-[26px] font-bold">Reset password</div>
          <div className="mb-7 text-sm leading-relaxed text-muted-foreground">
            Enter the mobile number on your account. We'll send a verification code.
          </div>
          <div className="mb-6 space-y-1.5">
            <Label htmlFor="fp-phone">Mobile number</Label>
            <Input
              id="fp-phone"
              className="h-12 rounded-full px-5"
              placeholder="024 123 4567"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            />
          </div>
          <Button type="submit" className="mb-5 h-12 w-full rounded-full" size="lg" disabled={loading}>
            {loading ? 'Sending…' : 'Send code'}
          </Button>
          <Link to="/login" className="block text-center text-[13px] font-semibold text-muted-foreground hover:text-foreground">
            Back to log in
          </Link>
        </form>
      )}

      {step === 2 && (
        <div>
          <div className="mb-1 text-[26px] font-bold">Enter code</div>
          <div className="mb-7 text-sm leading-relaxed text-muted-foreground">We sent a 6-digit code to {phone}.</div>
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
                className="w-full rounded-2xl border border-border bg-background py-3 text-center text-[22px] font-bold transition-colors focus:border-ring focus:outline-none focus:ring-3 focus:ring-ring/50"
              />
            ))}
          </div>
          <Button className="mb-5 h-12 w-full rounded-full" size="lg" onClick={submitOtp} disabled={loading}>
            {loading ? 'Verifying…' : 'Verify code'}
          </Button>
          <Link to="/login" className="block text-center text-[13px] font-semibold text-muted-foreground hover:text-foreground">
            Back to log in
          </Link>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={submitNewPassword}>
          <div className="mb-1 text-[26px] font-bold">New password</div>
          <div className="mb-7 text-sm leading-relaxed text-muted-foreground">Choose a new password for your account.</div>
          <div className="mb-3.5 space-y-1.5">
            <Label htmlFor="fp-new">New password</Label>
            <PasswordInput
              id="fp-new"
              className="h-12 rounded-full px-5"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="mb-6 space-y-1.5">
            <Label htmlFor="fp-confirm">Confirm password</Label>
            <PasswordInput
              id="fp-confirm"
              className="h-12 rounded-full px-5"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-12 w-full rounded-full" size="lg" disabled={loading}>
            {loading ? 'Resetting…' : 'Reset password'}
          </Button>
        </form>
      )}

      {step === 4 && (
        <div>
          <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="mb-1 text-[26px] font-bold">Password reset</div>
          <div className="mb-7 text-sm leading-relaxed text-muted-foreground">
            Your password has been changed. Log in with your new password.
          </div>
          <Button className="h-12 w-full rounded-full" size="lg" onClick={() => navigate('/login')}>
            Back to log in
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}

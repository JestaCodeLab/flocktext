import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/pages/auth/AuthLayout';
import * as authApi from '@/api/auth';
import { apiErrorMessage } from '@/api/client';
import { formatPhoneInput, normalizePhone } from '@/lib/phone';

export function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.values(form).some((v) => !v)) {
      toast.error('Please fill in every field to continue.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authApi.signup({ ...form, phone: normalizePhone(form.phone) });
      toast.success('Account created — verify your phone to continue.');
      navigate('/verify-otp', { state: { phone: form.phone } });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create your account.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit}>
        <div className="mb-1 text-[26px] font-bold">Create account</div>
        <div className="mb-7 text-sm text-muted-foreground">
          Set up your FlockText account. You'll add your church details next.
        </div>

        <div className="mb-3.5 space-y-1.5">
          <Label htmlFor="su-name">Full name</Label>
          <Input
            id="su-name"
            className="h-12 rounded-full px-5"
            placeholder="Thomas Brown"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>

        <div className="mb-3.5 space-y-1.5">
          <Label htmlFor="su-phone">Phone number</Label>
          <Input
            id="su-phone"
            className="h-12 rounded-full px-5"
            placeholder="024 123 4567"
            inputMode="numeric"
            value={form.phone}
            onChange={(e) => update('phone', formatPhoneInput(e.target.value))}
          />
        </div>

        <div className="mb-3.5 space-y-1.5">
          <Label htmlFor="su-email">Email</Label>
          <Input
            id="su-email"
            className="h-12 rounded-full px-5"
            placeholder="admin@church.org"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>

        <div className="mb-6 space-y-1.5">
          <Label htmlFor="su-password">Password</Label>
          <PasswordInput
            id="su-password"
            className="h-12 rounded-full px-5"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
          />
        </div>

        <Button type="submit" className="h-12 w-full rounded-full" size="lg" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>

        <div className="mt-6 text-center text-[13px] text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

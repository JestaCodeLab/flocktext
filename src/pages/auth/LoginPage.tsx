import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/pages/auth/AuthLayout';
import * as authApi from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { apiErrorMessage } from '@/api/client';
import { formatPhoneInput, normalizePhone } from '@/lib/phone';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Enter your mobile number and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login(normalizePhone(phone), password);
      setSession({ user: data.user, organization: data.organization }, data.accessToken, data.refreshToken);
      navigate('/app/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        toast('Verify your phone to continue.');
        navigate('/verify-otp', { state: { phone } });
        return;
      }
      toast.error(apiErrorMessage(err, 'Incorrect mobile number or password.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit}>
        <div className="mb-1 text-center text-[26px] font-bold lg:text-left">Welcome Back</div>
        <div className="mb-7 text-center text-sm text-muted-foreground lg:text-left">Log in to your organization's FlockText account.</div>

        <div className="mb-4 space-y-1.5">
          <Label htmlFor="login-phone">Mobile number</Label>
          <Input
            id="login-phone"
            className="h-12 rounded-full px-5"
            placeholder="024 123 4567"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          />
        </div>

        <div className="mb-2 space-y-1.5">
          <Label htmlFor="login-password">Password</Label>
          <PasswordInput
            id="login-password"
            className="h-12 rounded-full px-5"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="mb-6 text-right">
          <Link to="/forgot-password" className="text-[13px] font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="h-12 w-full rounded-full" size="lg" disabled={loading || !phone || !password}>
          {loading ? 'Logging in…' : 'Log in'}
        </Button>

        <div className="mt-6 text-center text-[13px] text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

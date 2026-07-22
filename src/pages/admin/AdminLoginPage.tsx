import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { adminLogin } from '@/api/adminAuth';
import { apiErrorMessage } from '@/api/client';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const setSession = useAdminAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await adminLogin(email, password);
      setSession({ admin: data.admin }, data.accessToken, data.refreshToken);
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Incorrect email or password.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-foreground p-6">
      <div className="w-full max-w-[380px] rounded-2xl border border-white/10 bg-card p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-[15px] font-extrabold leading-tight">FlockText</div>
            <div className="text-xs font-semibold text-muted-foreground">Admin console</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 space-y-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@flocktext.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6 space-y-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <PasswordInput
              id="admin-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading || !email || !password}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}

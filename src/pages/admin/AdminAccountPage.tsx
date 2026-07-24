import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck, UserRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { updateAdminMe, changeAdminPassword } from '@/api/adminAuth';
import { apiErrorMessage } from '@/api/client';
import { useAdminAuthStore } from '@/store/adminAuthStore';

function AdminDetailsCard() {
  const admin = useAdminAuthStore((s) => s.session?.admin);
  const updateAdmin = useAdminAuthStore((s) => s.updateAdmin);

  const [name, setName] = useState(admin?.name ?? '');
  const [email, setEmail] = useState(admin?.email ?? '');

  const save = useMutation({
    mutationFn: () => updateAdminMe({ name, email }),
    onSuccess: (data) => {
      updateAdmin(data.admin);
      toast.success('Account details updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <SettingsCard icon={UserRound} title="Admin details" description="Your name and email for the admin console." tint="blue">
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="admin-name">Full name</Label>
            <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <Button disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </SettingsCard>
  );
}

function AdminPasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const savePassword = useMutation({
    mutationFn: () => changeAdminPassword({ currentPassword, newPassword }),
    onSuccess: () => {
      toast.success('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSave() {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    savePassword.mutate();
  }

  return (
    <SettingsCard icon={ShieldCheck} title="Change password" description="Use a strong password you don't use elsewhere." tint="neutral">
      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="admin-current-password">Current password</Label>
          <PasswordInput id="admin-current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-new-password">New password</Label>
          <PasswordInput id="admin-new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-confirm-password">Confirm new password</Label>
          <PasswordInput id="admin-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button disabled={savePassword.isPending || !currentPassword || !newPassword} onClick={handleSave}>
          {savePassword.isPending ? 'Updating…' : 'Update password'}
        </Button>
      </div>
    </SettingsCard>
  );
}

export function AdminAccountPage() {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-[26px] font-extrabold">Account settings</div>
        <div className="text-sm text-muted-foreground">Manage your admin console login details.</div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AdminDetailsCard />
        <AdminPasswordCard />
      </div>
    </div>
  );
}

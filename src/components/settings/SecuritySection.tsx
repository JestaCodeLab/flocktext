import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { changePassword } from '@/api/auth';
import { apiErrorMessage } from '@/api/client';
import { SettingsCard } from './SettingsCard';

export function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const savePassword = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword }),
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
          <Label htmlFor="settings-current-password">Current password</Label>
          <PasswordInput id="settings-current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-new-password">New password</Label>
          <PasswordInput id="settings-new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-confirm-password">Confirm new password</Label>
          <PasswordInput id="settings-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button disabled={savePassword.isPending || !currentPassword || !newPassword} onClick={handleSave}>
          {savePassword.isPending ? 'Updating…' : 'Update password'}
        </Button>
      </div>
    </SettingsCard>
  );
}

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateNotifPrefs } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { NotifPrefs } from '@/types';

export function LowBalanceThresholdDialog({
  open,
  onOpenChange,
  prefs,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: NotifPrefs;
}) {
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const [threshold, setThreshold] = useState(String(prefs.lowBalanceThreshold));

  useEffect(() => {
    if (open) setThreshold(String(prefs.lowBalanceThreshold));
  }, [open, prefs.lowBalanceThreshold]);

  const save = useMutation({
    mutationFn: updateNotifPrefs,
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Low balance threshold updated.');
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSave() {
    const value = Math.round(Number(threshold));
    if (!Number.isFinite(value) || value < 1) {
      toast.error('Enter a threshold of at least 1 credit.');
      return;
    }
    save.mutate({ ...prefs, lowBalanceThreshold: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-[18px] w-[18px] text-primary" /> Low balance threshold
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="low-balance-threshold">Notify when credits fall below</Label>
          <Input
            id="low-balance-threshold"
            type="number"
            min={1}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
          <div className="text-xs text-muted-foreground">
            You'll get a notification the moment your balance drops below this number.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={save.isPending} onClick={handleSave}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

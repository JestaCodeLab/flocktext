import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Cake } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchBirthdayAutomation, updateBirthdayAutomation } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';

export function BirthdayAutomationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const automation = useQuery({ queryKey: ['birthday-automation'], queryFn: fetchBirthdayAutomation, enabled: open });

  const [enabled, setEnabled] = useState(false);
  const [sendTime, setSendTime] = useState('08:00');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (automation.data) {
      setEnabled(automation.data.enabled);
      setSendTime(automation.data.sendTime);
      setMessage(automation.data.message);
    }
  }, [automation.data]);

  const save = useMutation({
    mutationFn: updateBirthdayAutomation,
    onSuccess: (data) => {
      queryClient.setQueryData(['birthday-automation'], data);
      toast.success(data.enabled ? 'Birthday automation enabled.' : 'Birthday automation saved.');
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSave() {
    if (!message.trim()) {
      toast.error('Write a birthday message.');
      return;
    }
    save.mutate({ enabled, sendTime, message: message.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cake className="h-[18px] w-[18px] text-primary" /> Birthday automation
          </DialogTitle>
        </DialogHeader>

        {automation.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3.5">
              <div>
                <div className="text-sm font-semibold">Send birthday SMS automatically</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Off by default. Costs credits like any other send.</div>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday-send-time">Send time</Label>
              <Input id="birthday-send-time" type="time" className="w-40" value={sendTime} onChange={(e) => setSendTime(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday-message">Message</Label>
              <Textarea
                id="birthday-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Happy birthday, {name}! …"
              />
              <div className="text-xs text-muted-foreground">
                Use <span className="font-semibold text-foreground/80">{'{name}'}</span> and{' '}
                <span className="font-semibold text-foreground/80">{'{churchName}'}</span> — they're replaced per contact.
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={automation.isLoading || save.isPending} onClick={handleSave}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AdminOrgUser } from '@/types/admin';

export function SendVerificationReminderDialog({
  target,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  target: AdminOrgUser | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const previewMessage = target
    ? `You started signing up for FlockText but didn't complete your registration. Your verification code is XXXXXX. It expires in 10 minutes. Continue here: ${window.location.origin}/verify-otp?phone=${encodeURIComponent(target.phone)}`
    : '';

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send verification reminder to {target?.name}?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Sends a fresh verification code by SMS to <span className="font-semibold text-foreground">{target?.phone}</span>, with a
            link back to finish signing up. A real 6-digit code replaces XXXXXX below at send time.
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground/80">
            {previewMessage}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isPending} onClick={onConfirm}>
            {isPending ? 'Sending…' : 'Send SMS'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

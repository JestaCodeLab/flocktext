import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BadgeCheck, Plus, Star, Trash2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddSenderIdDialog } from '@/components/organization/AddSenderIdDialog';
import { setPrimarySenderId, deleteSenderId } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { senderIdStatusLabel, senderIdStatusVariant } from '@/lib/senderIdStatus';
import { SettingsCard } from './SettingsCard';

export function SenderIdsSection() {
  const organization = useAuthStore((s) => s.session?.organization);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const [showAdd, setShowAdd] = useState(false);
  const senderIds = organization?.senderIds ?? [];
  const hasApproved = senderIds.some((s) => s.status === 'approved');

  const setPrimary = useMutation({
    mutationFn: setPrimarySenderId,
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Primary sender ID updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: deleteSenderId,
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Sender ID removed.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <>
      <SettingsCard
        icon={BadgeCheck}
        title="Sender IDs"
        description="Register the names your messages send from."
        tint="gold"
        action={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-[15px] w-[15px]" /> Sender ID
          </Button>
        }
      >
        {senderIds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No sender IDs registered yet.
          </div>
        ) : (
          <>
            {!hasApproved && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-border/50 bg-background p-3 text-xs">
                <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="text-muted-foreground">
                  No approved sender ID yet. Until one is approved, your messages send from the platform's default sender ID.
                </div>
              </div>
            )}
            <div className="divide-y divide-border">
              {senderIds.map((s) => (
                <div key={s.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="text-[15px] font-bold">{s.senderId}</div>
                      {s.isPrimary && <Badge className='text-white'>Primary</Badge>}
                      <Badge className={senderIdStatusVariant[s.status] === 'default' ? 'text-white' : 'text-black'} variant={senderIdStatusVariant[s.status]}>{senderIdStatusLabel[s.status]}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {!s.isPrimary && (
                        <Button size="icon-sm" variant="ghost" disabled={setPrimary.isPending} onClick={() => setPrimary.mutate(s.id)}>
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {s.status !== 'approved' && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{s.purpose}</div>
                  {s.status === 'rejected' && s.rejectionReason && (
                    <div className="mt-2.5 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{s.rejectionReason}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </SettingsCard>

      <AddSenderIdDialog open={showAdd} onOpenChange={setShowAdd} />
    </>
  );
}

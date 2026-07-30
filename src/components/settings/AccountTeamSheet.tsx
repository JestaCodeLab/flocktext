import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UserPlus, Trash2, Undo2, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InviteTeamMemberDialog } from '@/components/organization/InviteTeamMemberDialog';
import { fetchTeam, updateTeamMemberRole, revokeTeamMember, restoreTeamMember, removeTeamMember, type TeamMember } from '@/api/team';
import { apiErrorMessage } from '@/api/client';
import { useAddonEntitlements } from '@/lib/addons';
import { useAuthStore } from '@/store/authStore';
import type { Account } from '@/types';
import { cn } from '@/lib/utils';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function AccountTeamSheet({
  account,
  open,
  onOpenChange,
}: {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.session?.user);
  const [showInvite, setShowInvite] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TeamMember | null>(null);

  // Role on the account being viewed, not the one the app is switched into -
  // being an admin elsewhere grants nothing here, and the API enforces the
  // same rule independently.
  const isAdmin = account?.role === 'admin';
  const organizationId = account?.organizationId;

  const team = useQuery({
    queryKey: ['team', organizationId ?? 'active'],
    queryFn: () => fetchTeam(organizationId),
    enabled: open && !!organizationId,
  });

  // Seats are billed per organization, so this reads the entitlements of the
  // account being viewed - not the one the app happens to be switched into.
  const entitlements = useAddonEntitlements(organizationId);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['team', organizationId ?? 'active'] });
  }

  function onMutationError(err: unknown) {
    toast.error(apiErrorMessage(err));
  }

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'user' }) => updateTeamMemberRole(id, role, organizationId),
    onSuccess: () => {
      toast.success('Role updated.');
      invalidate();
    },
    onError: onMutationError,
  });

  const revoke = useMutation({
    mutationFn: (id: string) => revokeTeamMember(id, organizationId),
    onSuccess: (member) => {
      toast.success(`${member.name}'s access revoked — you can restore it any time.`);
      invalidate();
    },
    onError: onMutationError,
  });

  const restore = useMutation({
    mutationFn: (id: string) => restoreTeamMember(id, organizationId),
    onSuccess: (member) => {
      toast.success(`${member.name}'s access restored.`);
      invalidate();
    },
    onError: onMutationError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeTeamMember(id, organizationId),
    onSuccess: () => {
      toast.success('Member deleted.');
      setPendingDelete(null);
      invalidate();
    },
    onError: (err) => {
      setPendingDelete(null);
      onMutationError(err);
    },
  });

  const busy = changeRole.isPending || revoke.isPending || restore.isPending || remove.isPending;
  const activeCount = team.data?.filter((m) => m.status === 'active').length ?? 0;
  const revokedCount = team.data?.filter((m) => m.status === 'revoked').length ?? 0;

  // Revoked members hold no seat, matching how the server counts them when
  // inviting or restoring.
  const additionalMemberCount = team.data?.filter((m) => !m.isFounder && m.status === 'active').length ?? 0;
  const purchasedSeats = entitlements.data?.purchasedSeats ?? 0;
  const remainingSeats = purchasedSeats - additionalMemberCount;
  const seatAddonGhs = entitlements.data?.addons.find((a) => a.key === 'extra_team_seat')?.ghs ?? 0;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="max-w-md overflow-y-auto sm:max-w-lg">
          <SheetHeader className="pr-10">
            <SheetTitle>{account?.churchName || 'Untitled account'}</SheetTitle>
            <SheetDescription>
              You are {account?.role === 'admin' ? 'an admin' : 'a user'} here
              {account?.isFounder ? ' and created this account' : ''}.
              {account?.isActive ? " It's the account you're currently working in." : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-[13px] font-bold text-foreground/80">
              Team
              <span className="ml-1.5 font-normal text-muted-foreground">
                {activeCount} active{revokedCount > 0 ? `, ${revokedCount} revoked` : ''}
              </span>
            </div>
            {isAdmin && (
              <Button size="sm" disabled={entitlements.isLoading} onClick={() => setShowInvite(true)}>
                <UserPlus className="h-[15px] w-[15px]" /> Invite
              </Button>
            )}
          </div>

          {isAdmin && (
            <div className="text-xs font-semibold text-muted-foreground">
              {remainingSeats > 0
                ? `${remainingSeats} additional seat${remainingSeats === 1 ? '' : 's'} available on this account.`
                : `No free seats on this account — inviting adds one for GHS ${seatAddonGhs}.`}
            </div>
          )}

          {team.isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {team.isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
              {apiErrorMessage(team.error, 'Could not load this account’s team.')}
            </div>
          )}

          {team.data && (
            <div className="space-y-2">
              {team.data.map((member) => {
                const isSelf = member.id === currentUser?.id;
                const isRevoked = member.status === 'revoked';
                return (
                  <div
                    key={member.id}
                    className={cn(
                      'rounded-xl border border-border bg-secondary/30 p-3.5',
                      isRevoked && 'border-dashed bg-transparent'
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          isRevoked ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'
                        )}
                      >
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn('truncate text-sm font-semibold', isRevoked && 'text-muted-foreground')}>
                            {member.name}
                          </span>
                          {isSelf && <Badge variant="outline">You</Badge>}
                          {member.isFounder && <Badge variant="outline">Founder</Badge>}
                          {isRevoked && <Badge variant="secondary">Revoked</Badge>}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pl-12">
                      {isAdmin && !isSelf && !isRevoked ? (
                        <Select
                          value={member.role}
                          onValueChange={(v) => changeRole.mutate({ id: member.id, role: v as 'admin' | 'user' })}
                        >
                          <SelectTrigger size="sm" disabled={busy}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                          {member.role}
                        </Badge>
                      )}

                      {isAdmin && !isSelf && (
                        <div className="flex items-center gap-1.5">
                          {isRevoked ? (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => restore.mutate(member.id)}>
                              <Undo2 className="h-3.5 w-3.5" /> Restore
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => revoke.mutate(member.id)}>
                              <ShieldOff className="h-3.5 w-3.5" /> Revoke
                            </Button>
                          )}
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive"
                            aria-label={`Delete ${member.name}`}
                            disabled={busy}
                            onClick={() => setPendingDelete(member)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isAdmin && team.data && (
            <div className="text-xs text-muted-foreground">Only an admin of this account can invite or remove people.</div>
          )}
        </SheetContent>
      </Sheet>

      {organizationId && (
        <InviteTeamMemberDialog
          open={showInvite}
          onOpenChange={setShowInvite}
          organizationId={organizationId}
          needsSeat={remainingSeats <= 0}
          seatPriceGhs={seatAddonGhs}
        />
      )}

      <Dialog open={!!pendingDelete} onOpenChange={(next) => !next && setPendingDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {pendingDelete?.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes them from "{account?.churchName || 'this account'}" — there'll be nothing left to
              restore. To cut off access in a way you can undo, revoke it instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={remove.isPending} onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
            >
              {remove.isPending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InviteTeamMemberDialog } from '@/components/organization/InviteTeamMemberDialog';
import { fetchTeam, updateTeamMemberRole, removeTeamMember } from '@/api/team';
import { initializeAddonPurchase, verifyAddonPurchase } from '@/api/addons';
import { apiErrorMessage } from '@/api/client';
import { openPaystackPopup } from '@/lib/paystack';
import { useAuthStore } from '@/store/authStore';
import { useAddonEntitlements } from '@/lib/addons';
import { SettingsCard } from './SettingsCard';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function TeamSection() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.session?.user);
  const isAdmin = currentUser?.role === 'admin';
  const [showInvite, setShowInvite] = useState(false);
  const team = useQuery({ queryKey: ['team'], queryFn: fetchTeam });
  const entitlements = useAddonEntitlements();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['team'] });
  }

  // The webhook is the authoritative confirmation, but this gives immediate
  // feedback - both paths call the same idempotent credit logic, so whichever
  // lands first wins.
  const verify = useMutation({
    mutationFn: verifyAddonPurchase,
    onSuccess: () => {
      toast.success('Payment confirmed — seat added.');
      queryClient.invalidateQueries({ queryKey: ['addons'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const buySeat = useMutation({
    mutationFn: () => initializeAddonPurchase('extra_team_seat'),
    onSuccess: async (data) => {
      if (data.mode === 'stub') {
        toast.success('Seat added.');
        queryClient.invalidateQueries({ queryKey: ['addons'] });
        return;
      }
      try {
        await openPaystackPopup({
          email: data.email,
          amountGHS: data.amountGHS,
          reference: data.reference,
          subaccountCode: data.subaccountCode,
          metadata: { organizationId: data.organizationId, addonKey: data.addonKey, kind: 'addon' },
          onSuccess: (reference) => verify.mutate(reference),
          onClose: () => toast('Payment cancelled.'),
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not open checkout.');
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const additionalMemberCount = team.data?.filter((m) => !m.isFounder).length ?? 0;
  const purchasedSeats = entitlements.data?.purchasedSeats ?? 0;
  const remainingSeats = purchasedSeats - additionalMemberCount;
  const seatAddonGhs = entitlements.data?.addons.find((a) => a.key === 'extra_team_seat')?.ghs ?? 0;

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'user' }) => updateTeamMemberRole(id, role),
    onSuccess: () => {
      toast.success('Role updated.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: removeTeamMember,
    onSuccess: () => {
      toast.success('Team member removed.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <>
      <SettingsCard
        icon={Users}
        title="Team"
        description={isAdmin ? 'Invite teammates and manage their access.' : 'Everyone with access to this account.'}
        tint="green"
        action={
          isAdmin &&
          (remainingSeats > 0 ? (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-[15px] w-[15px]" /> Invite
            </Button>
          ) : (
            <Button size="sm" disabled={buySeat.isPending} onClick={() => buySeat.mutate()}>
              <UserPlus className="h-[15px] w-[15px]" /> {buySeat.isPending ? 'Starting checkout…' : `Buy seat — GHS ${seatAddonGhs}`}
            </Button>
          ))
        }
      >
        {isAdmin && (
          <div className="mb-4 text-xs font-semibold text-muted-foreground">
            {remainingSeats > 0
              ? `${remainingSeats} additional seat${remainingSeats === 1 ? '' : 's'} available.`
              : 'No additional seats available — purchase a seat to invite another member.'}
          </div>
        )}
        {team.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {team.data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                {isAdmin && <TableHead className="w-px" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.data.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{member.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isAdmin && member.id !== currentUser?.id ? (
                      <Select value={member.role} onValueChange={(v) => changeRole.mutate({ id: member.id, role: v as 'admin' | 'user' })}>
                        <SelectTrigger size="sm">
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
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {member.id !== currentUser?.id && (
                        <Button size="icon-sm" variant="ghost" className="text-destructive" disabled={remove.isPending} onClick={() => remove.mutate(member.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsCard>

      <InviteTeamMemberDialog open={showInvite} onOpenChange={setShowInvite} />
    </>
  );
}

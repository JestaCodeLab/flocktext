import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users, UserPlus, Trash2, Undo2, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InviteTeamMemberDialog } from '@/components/organization/InviteTeamMemberDialog';
import { fetchTeam, updateTeamMemberRole, revokeTeamMember, restoreTeamMember, removeTeamMember } from '@/api/team';
import { apiErrorMessage } from '@/api/client';
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
  const membership = useAuthStore((s) => s.session?.membership);
  const isAdmin = membership?.role === 'admin';
  const [showInvite, setShowInvite] = useState(false);
  // 'active' rather than an id: this section always follows whichever account
  // the app is switched into, so it must not collide with the per-account
  // rosters Settings > Account loads for the user's other organizations.
  const team = useQuery({ queryKey: ['team', 'active'], queryFn: () => fetchTeam() });
  const entitlements = useAddonEntitlements();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['team', 'active'] });
  }

  // Revoked members hold no seat, so they don't count against the purchased
  // total - matching how the server counts seats when inviting or restoring.
  const additionalMemberCount = team.data?.filter((m) => !m.isFounder && m.status === 'active').length ?? 0;
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

  const revoke = useMutation({
    mutationFn: (id: string) => revokeTeamMember(id),
    onSuccess: (member) => {
      toast.success(`${member.name}'s access revoked — you can restore it any time.`);
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const restore = useMutation({
    mutationFn: (id: string) => restoreTeamMember(id),
    onSuccess: (member) => {
      toast.success(`${member.name}'s access restored.`);
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeTeamMember(id),
    onSuccess: () => {
      toast.success('Team member deleted.');
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
          isAdmin && (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-[15px] w-[15px]" /> Invite Team Member
            </Button>
          )
        }
      >
        {isAdmin && (
          <div className="mb-4 text-xs font-semibold text-muted-foreground">
            {remainingSeats > 0
              ? `${remainingSeats} additional seat${remainingSeats === 1 ? '' : 's'} available.`
              : `No free seats — inviting adds one for GHS ${seatAddonGhs}.`}
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
              {team.data.map((member) => {
                const isSelf = member.id === currentUser?.id;
                const isRevoked = member.status === 'revoked';
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={
                            isRevoked
                              ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground'
                              : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground'
                          }
                        >
                          {getInitials(member.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={isRevoked ? 'truncate text-sm font-semibold text-muted-foreground' : 'truncate text-sm font-semibold'}>
                              {member.name}
                            </span>
                            {isRevoked && <Badge variant="secondary">Revoked</Badge>}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isAdmin && !isSelf && !isRevoked ? (
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
                        {!isSelf && (
                          <div className="flex items-center justify-end gap-1.5">
                            {isRevoked ? (
                              <Button size="sm" variant="outline" disabled={restore.isPending} onClick={() => restore.mutate(member.id)}>
                                <Undo2 className="h-3.5 w-3.5" /> Restore
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled={revoke.isPending} onClick={() => revoke.mutate(member.id)}>
                                <ShieldOff className="h-3.5 w-3.5" /> Revoke
                              </Button>
                            )}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-destructive"
                              aria-label={`Delete ${member.name}`}
                              disabled={remove.isPending}
                              onClick={() => remove.mutate(member.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SettingsCard>

      <InviteTeamMemberDialog open={showInvite} onOpenChange={setShowInvite} allowAccountPicker />
    </>
  );
}

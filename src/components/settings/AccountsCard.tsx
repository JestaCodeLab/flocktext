import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Building2, Plus, ChevronRight, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AccountTeamSheet } from '@/components/settings/AccountTeamSheet';
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog';
import { fetchAccounts, createAccount, switchAccount, deleteAccount } from '@/api/memberships';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { Account, Session } from '@/types';
import { SettingsCard } from './SettingsCard';
import { cn } from '@/lib/utils';

export function AccountsCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const [selected, setSelected] = useState<Account | null>(null);
  // Same confirmation the header switcher uses - switching swaps the whole
  // app's data context, so it shouldn't happen on a single stray click.
  const [pendingSwitch, setPendingSwitch] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const accounts = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts });

  // Switching repoints the whole app at another organization, so every cached
  // query belongs to the account we just left - clear rather than invalidate.
  function applySession(nextSession: Session) {
    const { accessToken, refreshToken } = useAuthStore.getState();
    setSession(nextSession, accessToken ?? '', refreshToken ?? '');
    queryClient.clear();
  }

  const switchTo = useMutation({
    mutationFn: switchAccount,
    onSuccess: (nextSession) => {
      setPendingSwitch(null);
      applySession(nextSession);
      toast.success(`Switched to ${nextSession.organization.churchName || 'that account'}.`);
      navigate('/app/dashboard');
    },
    onError: (err) => {
      setPendingSwitch(null);
      toast.error(apiErrorMessage(err));
    },
  });

  const create = useMutation({
    mutationFn: () => createAccount(),
    onSuccess: (nextSession) => {
      applySession(nextSession);
      navigate('/onboarding');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (password: string) => deleteAccount(deleteTarget!.organizationId, password),
    onSuccess: (result) => {
      setDeleteTarget(null);
      applySession(result);
      toast.success(result.purged ? 'Account and all its data have been permanently deleted.' : 'You no longer have access to that account.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const busy = switchTo.isPending || create.isPending;
  // Deleting your only account isn't supported here (see membershipController.deleteAccount's
  // "only account" guard) - hide the action rather than let someone click into a 422.
  const canDeleteAccounts = (accounts.data?.length ?? 0) > 1;

  return (
    <>
      <SettingsCard
        icon={Building2}
        title="Your accounts"
        description="Every organization you belong to. Open one to manage who has access to it."
        tint="primary"
        action={
          <Button size="sm" disabled={busy} onClick={() => create.mutate()}>
            <Plus className="h-[15px] w-[15px]" /> {create.isPending ? 'Creating…' : 'Add account'}
          </Button>
        }
      >
        {accounts.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {accounts.data && (
          <div className="space-y-2">
            {accounts.data.map((account) => (
              <div
                key={account.organizationId}
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-xl border p-3.5 transition-colors',
                  account.isActive ? 'border-primary/40 bg-accent/30' : 'border-border bg-secondary/30'
                )}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => setSelected(account)}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      account.isActive ? 'bg-primary text-white' : 'bg-accent text-accent-foreground'
                    )}
                  >
                    {account.isActive ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold">{account.churchName || 'Untitled account'}</span>
                      {account.isActive && <Badge>Current</Badge>}
                      {account.isFounder && <Badge variant="outline">Founder</Badge>}
                    </div>
                    <div className="text-xs capitalize text-muted-foreground">{account.role}</div>
                  </div>
                </button>

                <div className="ml-auto flex items-center gap-1.5">
                  {!account.isActive && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setPendingSwitch(account)}>
                      Switch
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`View ${account.churchName || 'account'} details`}
                    onClick={() => setSelected(account)}
                  >
                    Details <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  {canDeleteAccounts && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive"
                      aria-label={`Delete ${account.churchName || 'account'}`}
                      disabled={busy}
                      onClick={() => setDeleteTarget(account)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>

      <AccountTeamSheet account={selected} open={!!selected} onOpenChange={(next) => !next && setSelected(null)} />

      <DeleteAccountDialog
        account={deleteTarget}
        onOpenChange={(open) => !open && !remove.isPending && setDeleteTarget(null)}
        isPending={remove.isPending}
        onConfirm={(password) => remove.mutate(password)}
      />

      <Dialog
        open={!!pendingSwitch}
        onOpenChange={(next) => {
          if (!next && !switchTo.isPending) setPendingSwitch(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Switch to {pendingSwitch?.churchName || 'this account'}?</DialogTitle>
            <DialogDescription>
              FlockText will reload with {pendingSwitch?.churchName || 'that account'}'s contacts, messages, and wallet, and
              you'll land on its dashboard. Anything unsaved on this page will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={switchTo.isPending} onClick={() => setPendingSwitch(null)}>
              Stay here
            </Button>
            <Button
              disabled={switchTo.isPending}
              onClick={() => pendingSwitch && switchTo.mutate(pendingSwitch.organizationId)}
            >
              {switchTo.isPending ? 'Switching…' : 'Switch account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

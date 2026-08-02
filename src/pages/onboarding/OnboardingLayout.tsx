import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { fetchAccounts, removeAccount } from '@/api/memberships';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Contacts is the terminal step - finishing or skipping it completes onboarding.
// Orgs left mid-wizard from when a wallet step existed carry onboardingStep 5;
// the Math.min clamp below lands them on contacts, so no back-fill is needed.
const STEP_PATHS = ['welcome', 'organization', 'sender-id', 'contacts'];

export function OnboardingLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const organization = useAuthStore((s) => s.session?.organization);
  const setSession = useAuthStore((s) => s.setSession);
  const location = useLocation();
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Only someone who already has another account is offered this - if this
  // were their only one, "cancel setup" would really mean "delete my whole
  // identity," which is a different, more deliberate action (Settings >
  // Delete account).
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts });
  const canCancel = (accounts.data?.length ?? 0) > 1;

  const removeAccountMutation = useMutation({
    mutationFn: () => removeAccount(organization!.id),
    onSuccess: (nextSession) => {
      const { accessToken, refreshToken } = useAuthStore.getState();
      setSession(nextSession, accessToken ?? '', refreshToken ?? '');
      queryClient.clear();
      toast.success('Account removed.');
      navigate('/app/dashboard', { replace: true });
    },
    onError: (err) => {
      setShowRemoveConfirm(false);
      toast.error(apiErrorMessage(err));
    },
  });

  if (!organization) return null;

  if (location.pathname === '/onboarding' || location.pathname === '/onboarding/') {
    const target = STEP_PATHS[Math.min(organization.onboardingStep, STEP_PATHS.length) - 1] || 'welcome';
    return <Navigate to={`/onboarding/${target}`} replace />;
  }

  const currentIndex = STEP_PATHS.indexOf(location.pathname.split('/').pop() || '');

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-[560px] rounded-[28px] border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <img src="/logo/flocktext-logo.png" alt="FlockText" className="h-9 w-auto dark:hidden" />
            <img src="/logo/flocktext-logo-white.png" alt="FlockText" className="hidden h-9 w-auto dark:block" />
          </div>
          {canCancel && (
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setShowRemoveConfirm(true)}
            >
              Cancel setup
            </button>
          )}
        </div>

        <div className="mb-8 flex gap-1.5">
          {STEP_PATHS.map((step, i) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentIndex ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>

        <Outlet />

        <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Cancel setup?</DialogTitle>
              <DialogDescription>
                This removes "{organization.churchName || 'this account'}" completely - anything you've entered so far will be lost. You'll go back to your other account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRemoveConfirm(false)} disabled={removeAccountMutation.isPending}>
                Keep setting up
              </Button>
              <Button variant="destructive" onClick={() => removeAccountMutation.mutate()} disabled={removeAccountMutation.isPending}>
                {removeAccountMutation.isPending ? 'Removing…' : 'Remove account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

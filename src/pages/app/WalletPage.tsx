import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Wallet as WalletIcon, Receipt, RefreshCw, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditPackageGrid } from '@/components/wallet/CreditPackageGrid';
import { fetchWallet, initializeTopup, verifyTopup } from '@/api/wallet';
import { apiErrorMessage } from '@/api/client';
import { openPaystackPopup } from '@/lib/paystack';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export function WalletPage() {
  const queryClient = useQueryClient();
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });
  const [activeTab, setActiveTab] = useState<'packages' | 'transactions'>('packages');

  function applyTopupResult(data: { walletBalanceCredits: number }) {
    updateOrganization({ walletBalanceCredits: data.walletBalanceCredits });
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  }

  // The webhook is the authoritative confirmation, but this gives immediate
  // feedback - both paths call the same idempotent credit logic, so whichever
  // lands first wins.
  const verify = useMutation({
    mutationFn: verifyTopup,
    onSuccess: (data) => {
      applyTopupResult(data);
      toast.success('Payment confirmed — credits added to your wallet.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const topup = useMutation({
    mutationFn: initializeTopup,
    onSuccess: async (data) => {
      if (data.mode === 'stub') {
        applyTopupResult(data);
        toast.success('Credits added to your wallet.');
        return;
      }
      try {
        await openPaystackPopup({
          email: data.email,
          amountGHS: data.amountGHS,
          reference: data.reference,
          subaccountCode: data.subaccountCode,
          metadata: { organizationId: data.organizationId, packageGhs: data.packageGhs },
          onSuccess: (reference) => verify.mutate(reference),
          onClose: () => toast('Payment cancelled.'),
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not open checkout.');
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="mb-6 text-[26px] font-bold">SMS Credit</div>

      {wallet.isLoading ? (
        <div className="mb-6.5 grid grid-cols-2 gap-4">
          <Skeleton className="h-[104px] rounded-2xl" />
          <Skeleton className="h-[104px] rounded-2xl" />
        </div>
      ) : (
        <div className="mb-6.5 grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6.5">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-[13px] text-muted-foreground">Available balance</span>
                <button
                  type="button"
                  onClick={() => wallet.refetch()}
                  disabled={wallet.isFetching}
                  className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
                >
                  <RefreshCw className={cn('h-3 w-3', wallet.isFetching && 'animate-spin')} />
                  Check balance
                </button>
              </div>
              <div className="text-[34px] font-extrabold">
                {(wallet.data?.walletBalanceCredits ?? 0).toLocaleString()} <span className="text-base font-semibold text-muted-foreground">credits</span>
              </div>
            </div>
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <WalletIcon className="h-6 w-6" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6.5">
            <div>
              <div className="mb-1.5 text-[13px] text-muted-foreground">Credits used</div>
              <div className="text-[34px] font-extrabold">
                {(wallet.data?.creditsUsed ?? 0).toLocaleString()} <span className="text-base font-semibold text-muted-foreground">credits</span>
              </div>
            </div>
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex w-fit rounded-lg border border-border p-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('packages')}
          className={cn(
            'rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
            activeTab === 'packages' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          SMS packages
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={cn(
            'rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
            activeTab === 'transactions' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Transaction History
        </button>
      </div>

      {activeTab === 'packages' && (
        <>
          {wallet.isLoading ? (
            <div className="mb-6 grid grid-cols-4 gap-3.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[212px] rounded-xl" />
              ))}
            </div>
          ) : (
            wallet.data && (
              <div className="mb-6">
                <CreditPackageGrid packages={wallet.data.packages} onBuy={(ghs) => topup.mutate(ghs)} buying={topup.isPending} />
              </div>
            )
          )}

          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <CreditCard className="h-[15px] w-[15px] text-primary" />
            Paid using — card or mobile money. Credit lands instantly and never expires.
          </div>
        </>
      )}

      {activeTab === 'transactions' &&
        (wallet.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : wallet.data?.transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="text-sm text-muted-foreground">No transactions yet.</div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date &amp; time</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallet.data?.transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{t.label}</TableCell>
                    <TableCell>
                      <Badge variant="success">Successful</Badge>
                    </TableCell>
                    <TableCell className={cn('text-right font-bold tabular-nums', t.credits > 0 ? 'text-success' : 'text-foreground')}>
                      {t.credits > 0 ? '+' : ''}
                      {t.credits.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {t.amountGHS > 0 ? `GHS ${t.amountGHS.toFixed(2)}` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
    </div>
  );
}

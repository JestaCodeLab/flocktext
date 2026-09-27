import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchAdminOrganizations } from '@/api/adminOrganizations';
import { recordAdminTransaction } from '@/api/adminTransactions';
import { apiErrorMessage } from '@/api/client';
import { cn } from '@/lib/utils';
import type { AdminOrgListItem } from '@/types/admin';

const MAX_ORG_RESULTS = 20;

function emptyForm() {
  return { credits: '', amountGHS: '', label: '', reference: '' };
}

export function RecordTransactionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [org, setOrg] = useState<AdminOrgListItem | null>(null);
  const [orgSearchInput, setOrgSearchInput] = useState('');
  const [orgSearch, setOrgSearch] = useState('');
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    const t = setTimeout(() => setOrgSearch(orgSearchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [orgSearchInput]);

  useEffect(() => {
    if (!open) {
      setOrg(null);
      setOrgSearchInput('');
      setOrgSearch('');
      setForm(emptyForm());
    }
  }, [open]);

  const orgResults = useQuery({
    queryKey: ['admin-organizations-search', orgSearch],
    queryFn: () => fetchAdminOrganizations({ search: orgSearch, pageSize: MAX_ORG_RESULTS }),
    enabled: orgSearch.length > 0 && !org,
  });

  const record = useMutation({
    mutationFn: () =>
      recordAdminTransaction({
        organizationId: org!.id,
        credits: Number(form.credits),
        amountGHS: form.amountGHS.trim() ? Number(form.amountGHS) : 0,
        label: form.label.trim(),
        reference: form.reference.trim() || undefined,
      }),
    onSuccess: (data) => {
      toast.success(`Recorded — ${org!.churchName}'s new balance is ${data.walletBalanceCredits.toLocaleString()} credits.`);
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const creditsNum = Number(form.credits);
  const canSubmit = !!org && Number.isFinite(creditsNum) && creditsNum !== 0 && form.label.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="text-muted-foreground">
            For a real payment the normal flow never captured (e.g. a mobile app checkout that never verified) - this
            credits/debits the org's wallet and logs it here with a reference, same as an automated purchase.
          </div>

          <div className="space-y-1.5">
            <Label>Organization</Label>
            {org ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{org.churchName}</div>
                  <div className="text-xs text-muted-foreground">Current balance: {org.walletBalanceCredits.toLocaleString()} credits</div>
                </div>
                <Button size="icon-sm" variant="ghost" onClick={() => setOrg(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search organizations by name…"
                    className="pl-10"
                    value={orgSearchInput}
                    onChange={(e) => setOrgSearchInput(e.target.value)}
                    autoFocus
                  />
                </div>
                {orgSearchInput.trim().length > 0 && (
                  <div className={cn('max-h-[180px] overflow-auto rounded-lg', 'border border-border')}>
                    {orgResults.isLoading && <div className="p-3 text-sm text-muted-foreground">Searching…</div>}
                    {!orgResults.isLoading && (orgResults.data?.organizations.length ?? 0) === 0 && (
                      <div className="p-3 text-sm text-muted-foreground">No organizations found.</div>
                    )}
                    {orgResults.data?.organizations.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setOrg(o);
                          setOrgSearchInput('');
                          setOrgSearch('');
                        }}
                        className="flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-secondary/60"
                      >
                        <div className="truncate text-sm font-semibold">{o.churchName}</div>
                        <div className="shrink-0 text-xs text-muted-foreground">{o.walletBalanceCredits.toLocaleString()} credits</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tx-credits">Credits (negative to debit)</Label>
              <Input
                id="tx-credits"
                type="number"
                value={form.credits}
                onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tx-amount">Amount paid (GHS, optional)</Label>
              <Input
                id="tx-amount"
                type="number"
                value={form.amountGHS}
                onChange={(e) => setForm((f) => ({ ...f, amountGHS: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-label">Label / description</Label>
            <Input
              id="tx-label"
              placeholder="Manual credit - mobile app payment never verified"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-reference">Reference (optional)</Label>
            <Input
              id="tx-reference"
              placeholder="Paystack reference, receipt number, etc."
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            />
            <div className="text-xs text-muted-foreground">
              When given, this is enforced unique - the same payment can never be recorded twice, by this or any automated path.
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || record.isPending} onClick={() => record.mutate()}>
            {record.isPending ? 'Recording…' : 'Record transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

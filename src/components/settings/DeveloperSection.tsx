import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, Plus, Trash2, Copy, Info, ChevronDown, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { fetchApiKeys, createApiKey, revokeApiKey, type ApiKey } from '@/api/developer';
import { apiErrorMessage } from '@/api/client';
import { cn } from '@/lib/utils';
import { API_ENDPOINTS, STATUS_TEXT, endpointKey, statusBadgeVariant } from '@/lib/apiDocs';
import { SettingsCard } from './SettingsCard';

export function DeveloperSection() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [openEndpoint, setOpenEndpoint] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  function toggleExpanded(key: string) {
    setOpenEndpoint((prev) => (prev === key ? null : key));
  }

  const keys = useQuery({ queryKey: ['api-keys'], queryFn: fetchApiKeys });

  const create = useMutation({
    mutationFn: () => createApiKey(label),
    onSuccess: (data) => {
      setShowCreate(false);
      setLabel('');
      setRevealedKey(data.key);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const revoke = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      toast.success('API key revoked.');
      setKeyToRevoke(null);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function copyKey() {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    toast.success('Copied to clipboard.');
  }

  function copyKeyPrefix(prefix: string) {
    navigator.clipboard.writeText(prefix);
    toast.success('Key prefix copied to clipboard.');
  }

  return (
    <>
      <SettingsCard
        icon={KeyRound}
        title="API keys"
        description="Let your own systems call FlockText directly - check balance, manage sender IDs, and send SMS."
        tint="blue"
        action={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-[15px] w-[15px]" /> Generate new key
          </Button>
        }
      >
        {keys.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {keys.data?.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No API keys yet.
          </div>
        )}
        {!!keys.data?.length && (
          <div className="space-y-2.5">
            {keys.data.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{k.label}</div>
                    {k.revoked && (
                      <Badge variant="secondary" className="capitalize">
                        Revoked
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground">{k.keyPrefix}••••••••</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Created {new Date(k.createdAt).toLocaleDateString()} · Last used{' '}
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'never'}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => copyKeyPrefix(k.keyPrefix)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  {!k.revoked && (
                    <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setKeyToRevoke(k)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>

      <div className="mt-5 rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-[16px] font-medium text-foreground/80">Reference</div>
          <Button size="sm" variant="outline" render={<Link to="/app/developer-docs" />}>
            <BookOpen className="h-[15px] w-[15px]" /> Full API docs
          </Button>
        </div>
        <div className="mb-4 space-y-1 text-sm">
          <div className="text-muted-foreground">
            Base URL: <span className="font-mono text-foreground">{window.location.origin.replace(/:\d+$/, '')}/api</span>
          </div>
          <div className="text-muted-foreground">
            Auth header: <span className="font-mono text-foreground">Authorization: Bearer &lt;your key&gt;</span>
          </div>
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {API_ENDPOINTS.map((e) => {
            const key = endpointKey(e);
            const isOpen = openEndpoint === key;
            return (
              <Collapsible key={key} open={isOpen} onOpenChange={() => toggleExpanded(key)}>
                <CollapsibleTrigger className="w-full text-left">
                  <div className="flex w-full items-start justify-between gap-3 p-3 text-sm">
                    <div className="flex min-w-0 items-start gap-3">
                      <Badge variant="outline" className="mt-0.5 shrink-0 font-mono">
                        {e.method}
                      </Badge>
                      <div className="min-w-0">
                        <div className="font-mono text-foreground">{e.path}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{e.description}</div>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn('mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 border-t border-border bg-background/50 p-3">
                    {e.requestBody && (
                      <div>
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Request body
                        </div>
                        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs">
                          <code>{e.requestBody}</code>
                        </pre>
                      </div>
                    )}
                    <div>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Response</span>
                        <Badge variant={statusBadgeVariant(e.status)} className="font-mono">
                          {e.status} {STATUS_TEXT[e.status]}
                        </Badge>
                      </div>
                      <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs">
                        <code>{e.response}</code>
                      </pre>
                    </div>
                    {!!e.errors?.length && (
                      <div>
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Error responses
                        </div>
                        <div className="space-y-1.5">
                          {e.errors.map((err) => (
                            <div key={err.status} className="flex items-start gap-2 text-xs">
                              <Badge variant={statusBadgeVariant(err.status)} className="mt-0.5 shrink-0 font-mono">
                                {err.status} {STATUS_TEXT[err.status]}
                              </Badge>
                              <span className="text-muted-foreground">{err.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Generate API key</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="api-key-label">Label</Label>
            <Input
              id="api-key-label"
              placeholder="e.g. Production integration"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button disabled={create.isPending || !label.trim()} onClick={() => create.mutate()}>
              {create.isPending ? 'Generating…' : 'Generate key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!revealedKey} onOpenChange={(open) => !open && setRevealedKey(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-sm">{revealedKey}</code>
            <Button size="icon-sm" variant="ghost" onClick={copyKey}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <Info className="h-4 w-4 shrink-0" />
            <div>Copy this key now - you won't be able to see it again. Store it somewhere safe.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevealedKey(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!keyToRevoke} onOpenChange={(open) => !open && setKeyToRevoke(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke API key</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Revoke <span className="font-semibold text-foreground">{keyToRevoke?.label}</span>? Any system using this key will
            immediately lose access. This can't be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyToRevoke(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={revoke.isPending} onClick={() => keyToRevoke && revoke.mutate(keyToRevoke.id)}>
              {revoke.isPending ? 'Revoking…' : 'Revoke key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

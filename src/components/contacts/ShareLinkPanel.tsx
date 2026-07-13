import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getContactLink } from '@/api/organization';

export function ShareLinkPanel() {
  const link = useQuery({ queryKey: ['contact-link'], queryFn: getContactLink });
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!link.data) return;
    await navigator.clipboard.writeText(link.data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-1 text-[13px] font-bold text-foreground/80">Share a sign-up link</div>
      <div className="mb-4 text-xs text-muted-foreground">Members can add themselves — name, phone, and date of birth.</div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{link.data?.url ?? 'Loading…'}</div>
        <Button type="button" size="icon-sm" variant="ghost" onClick={copy} disabled={!link.data}>
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

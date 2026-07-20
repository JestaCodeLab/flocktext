import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, Check, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { API_ENDPOINTS, STATUS_TEXT, statusBadgeVariant, type ApiEndpointDoc, type ApiParam } from '@/lib/apiDocs';

const GROUPS: { key: ApiEndpointDoc['group']; title: string; description: string }[] = [
  { key: 'Wallet', title: 'Wallet', description: 'Check credit balance and start top-ups.' },
  { key: 'Sender IDs', title: 'Sender IDs', description: 'Register, list, check, and remove the names your messages send from.' },
  { key: 'Messages', title: 'Messages', description: 'Send SMS to a phone number, group, selection, or your full contact list.' },
];

function apiBaseUrl() {
  return `${window.location.origin.replace(/:\d+$/, '')}/api`;
}

function examplePathFor(e: ApiEndpointDoc): string {
  if (e.id === 'sender-ids-delete') return '/v1/sender-ids/665f1c2e9b1d4a0012a3f8d2';
  if (e.id === 'sender-ids-status') return '/v1/sender-ids/status?senderId=StPaulsChurch';
  return e.path;
}

function buildHttpSample(e: ApiEndpointDoc): string {
  const lines = [`${e.method} /api${examplePathFor(e)} HTTP/1.1`, 'Host: yourapp.flocktext.com', 'Authorization: Bearer flk_live_xxxxxxxxxxxxxxxxxxxx'];
  if (e.requestBody) lines.push('Content-Type: application/json', '', e.requestBody);
  return lines.join('\n');
}

function buildCurlSample(e: ApiEndpointDoc): string {
  const url = `https://yourapp.flocktext.com/api${examplePathFor(e)}`;
  const parts = [`curl -X ${e.method} '${url}'`, `-H 'Authorization: Bearer flk_live_xxxxxxxxxxxxxxxxxxxx'`];
  if (e.requestBody) {
    parts.push(`-H 'Content-Type: application/json'`);
    parts.push(`-d '${e.requestBody.replace(/\s*\n\s*/g, ' ').trim()}'`);
  }
  return parts.join(' \\\n  ');
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied to clipboard.');
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-[#0b1120]">
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/20"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="overflow-x-auto p-4 pt-9 text-xs leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function SampleRequestBlock({ e }: { e: ApiEndpointDoc }) {
  const [tab, setTab] = useState<'http' | 'curl'>('http');
  const code = tab === 'http' ? buildHttpSample(e) : buildCurlSample(e);

  return (
    <div>
      <div className="mb-2 flex gap-1">
        {(['http', 'curl'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-bold uppercase transition-colors',
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <CodeBlock code={code} />
    </div>
  );
}

function ParamsTable({ params }: { params: ApiParam[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Parameter</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Requirement</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {params.map((p) => (
            <TableRow key={p.name}>
              <TableCell className="font-mono text-xs whitespace-nowrap">{p.name}</TableCell>
              <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">{p.type}</TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant={p.requirement === 'Required' ? 'default' : 'outline'}>{p.requirement}</Badge>
              </TableCell>
              <TableCell className="min-w-48 text-sm whitespace-normal text-muted-foreground">{p.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EndpointInfoBox({ e }: { e: ApiEndpointDoc }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="w-36 text-xs font-semibold text-muted-foreground">API Endpoint</TableCell>
            <TableCell className="font-mono text-xs">
              {apiBaseUrl()}
              {e.path}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-xs font-semibold text-muted-foreground">Request Type</TableCell>
            <TableCell>
              <Badge variant="outline" className="font-mono">
                {e.method}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-xs font-semibold text-muted-foreground">Content Type</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{e.requestBody ? 'application/json' : '—'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function EndpointSection({ e }: { e: ApiEndpointDoc }) {
  return (
    <div id={e.id} className="scroll-mt-6 space-y-5">
      <div>
        <h3 className="text-lg font-bold">{e.summary}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.description}</p>
      </div>

      <EndpointInfoBox e={e} />

      {!!e.requestParams?.length && (
        <div>
          <div className="mb-2 text-xs font-bold tracking-wide text-foreground/70 uppercase">Request Parameters</div>
          <ParamsTable params={e.requestParams} />
        </div>
      )}

      <div>
        <div className="mb-2 text-xs font-bold tracking-wide text-foreground/70 uppercase">Response Parameters</div>
        <ParamsTable params={e.responseParams} />
      </div>

      <div>
        <div className="mb-2 text-xs font-bold tracking-wide text-foreground/70 uppercase">Sample Request</div>
        <SampleRequestBlock e={e} />
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <div className="text-xs font-bold tracking-wide text-foreground/70 uppercase">Sample Response</div>
          <Badge variant={statusBadgeVariant(e.status)} className="font-mono">
            {e.status} {STATUS_TEXT[e.status]}
          </Badge>
        </div>
        <CodeBlock code={e.response} />
      </div>

      {!!e.errors.length && (
        <div>
          <div className="mb-2 text-xs font-bold tracking-wide text-foreground/70 uppercase">Error Responses</div>
          <div className="space-y-1.5">
            {e.errors.map((err) => (
              <div key={err.status} className="flex items-start gap-2 text-sm">
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
  );
}

export function DeveloperDocsPage() {
  const navSections = [
    {
      title: 'Getting Started',
      items: [
        { id: 'overview', label: 'Overview' },
        { id: 'authentication', label: 'Authentication' },
      ],
    },
    ...GROUPS.map((g) => ({
      title: g.title,
      items: API_ENDPOINTS.filter((e) => e.group === g.key).map((e) => ({ id: e.id, label: e.summary })),
    })),
  ];
  const allAnchors = navSections.flatMap((s) => s.items);

  const [activeId, setActiveId] = useState(allAnchors[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    );
    const elements = allAnchors.map((a) => document.getElementById(a.id)).filter((el): el is HTMLElement => !!el);
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" render={<Link to="/app/settings" state={{ tab: 'developer' }} />}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
      </Button>

      <div className="mb-10">
        <h1 className="text-[28px] font-bold">FlockText Developer API</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reference for the external, API-key-authenticated integration surface at /api/v1.</p>
      </div>

      <div className="flex items-start gap-8">
        <aside className="sticky top-0 hidden w-56 shrink-0 self-start lg:block">
          <nav className="space-y-6 text-sm">
            {navSections.map((section) => (
              <div key={section.title}>
                <div className="mb-2 text-[12px] font-semibold tracking-wide text-black dark:text-white uppercase">{section.title}</div>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 space-y-14">
          <section id="overview" className="scroll-mt-6 space-y-4">
            <h2 className="text-2xl font-bold">Overview</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The FlockText Developer API lets your own systems check wallet balance, manage sender IDs, and send SMS directly - the
              same actions available in the FlockText web app, authenticated by an API key instead of a user session.
            </p>
            <div className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                All endpoints on this page are rate limited to <strong>100 requests / 15 minutes</strong> per organization. Manage
                your keys from{' '}
                <Link to="/app/settings" state={{ tab: 'developer' }} className="font-semibold text-primary underline underline-offset-2">
                  Settings → Developer
                </Link>
                .
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="w-36 text-xs font-semibold text-muted-foreground">Base URL</TableCell>
                    <TableCell className="font-mono text-xs">{apiBaseUrl()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs font-semibold text-muted-foreground">Content Type</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">application/json</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </section>

          <section id="authentication" className="scroll-mt-6 space-y-4">
            <h2 className="text-2xl font-bold">Authentication</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">Every request must include your API key as a bearer token:</p>
            <CodeBlock code="Authorization: Bearer flk_live_xxxxxxxxxxxxxxxxxxxx" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Generate a key from{' '}
              <Link to="/app/settings" state={{ tab: 'developer' }} className="font-semibold text-primary underline underline-offset-2">
                Settings → Developer
              </Link>
              . The raw key is shown once, at creation time - store it somewhere safe, since only its prefix is shown afterward.
              Requests with a missing, invalid, or revoked key receive a{' '}
              <Badge variant="destructive" className="font-mono">
                401 Unauthorized
              </Badge>
              .
            </p>
          </section>

          {GROUPS.map((g) => (
            <div key={g.key} className="space-y-10">
              <div className="border-b border-border pb-3">
                <h2 className="text-xl font-bold">{g.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
              </div>
              {API_ENDPOINTS.filter((e) => e.group === g.key).map((e) => (
                <EndpointSection key={e.id} e={e} />
              ))}
            </div>
          ))}
        </div>

        <aside className="sticky top-0 hidden w-52 shrink-0 self-start border-l border-border pl-5 xl:block">
          <div className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">On this page</div>
          <nav className="space-y-1 text-sm">
            {allAnchors.map((a) => (
              <a
                key={a.id}
                href={`#${a.id}`}
                className={cn(
                  'block py-1 text-muted-foreground transition-colors hover:text-foreground',
                  activeId === a.id && 'font-semibold text-primary'
                )}
              >
                {a.label}
              </a>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}

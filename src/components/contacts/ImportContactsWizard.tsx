import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  UploadCloud,
  X,
  Download,
  Smartphone,
  ChevronLeft,
  Upload as UploadIcon,
  Share2,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  IdCard,
  ClipboardPaste,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImportPreviewTable } from '@/components/contacts/ImportPreviewTable';
import { ImportGroupPrompt } from '@/components/contacts/ImportGroupPrompt';
import { ShareLinkPanel } from '@/components/contacts/ShareLinkPanel';
import {
  previewImportFile,
  importContacts,
  type ImportMethod,
  fetchContactPhones,
  fetchImportTemplateFile,
  type ImportResult,
  type ImportFileFormat,
} from '@/api/contacts';
import { apiErrorMessage } from '@/api/client';
import { cn } from '@/lib/utils';
import { useEntityLabels } from '@/lib/terminology';
import { parseVCard } from '@/lib/vcard';
import { annotateDuplicates, type PreviewRow } from '@/lib/contactImport';

type Stage = 'choice' | 'share' | 'paste' | 'format' | 'upload' | 'preview' | 'import';
type Format = ImportFileFormat | 'vcard';

const FORMAT_META: Record<Format, { label: string; icon: typeof FileText; accept: string; hint: string }> = {
  csv: { label: 'CSV', icon: FileText, accept: '.csv', hint: 'Comma-separated file with a header row (Name, Phone, Date of birth).' },
  xlsx: { label: 'Excel', icon: FileSpreadsheet, accept: '.xlsx', hint: 'Excel workbook (.xlsx) with a header row.' },
  pdf: { label: 'PDF', icon: FileIcon, accept: '.pdf', hint: 'A simple one-contact-per-line list — text is extracted best-effort.' },
  txt: { label: 'Text', icon: FileText, accept: '.txt', hint: 'Plain text, one contact per line (e.g. "Jane Doe, 024 123 4567").' },
  vcard: { label: 'vCard', icon: IdCard, accept: '.vcf,.vcard', hint: 'A vCard file exported from Contacts or a phone.' },
};

const TEMPLATES: Partial<Record<Format, { content: string; type: string; filename: string }>> = {
  csv: {
    content: 'Phone,Name,Date of Birth\n+15551234567,Jane Doe,1990-05-14\n',
    type: 'text/csv;charset=utf-8;',
    filename: 'contacts-template.csv',
  },
  txt: {
    content: '+15551234567, Jane Doe\n+15559876543, John Smith\n',
    type: 'text/plain;charset=utf-8;',
    filename: 'contacts-template.txt',
  },
};

// Must match MAX_IMPORT_ROWS in api/controllers/contactController.js, which rejects a
// single /contacts/import request over this size - rather than trimming or blocking an
// over-sized file, the wizard splits it into chunks of this size and runs one confirm
// request per chunk, sequentially (see runImport below).
const MAX_IMPORT_ROWS = 2000;

function chunkRows(rows: PreviewRow[], size: number): PreviewRow[][] {
  const chunks: PreviewRow[][] = [];
  for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size));
  return chunks;
}

type BatchStatus = 'pending' | 'uploading' | 'success' | 'error';
interface ImportBatch {
  rows: PreviewRow[];
  status: BatchStatus;
  result?: ImportResult;
  errorMessage?: string;
}

// Matches TEMPLATES' own column order below (Phone, Name, Date of Birth) - shown as a
// live example of "what your file should look like" under the dropzone, not just
// described in the hint text above it.
const SAMPLE_CONTACTS = [
  { phone: '+15551234567', name: 'Jane Doe', dob: '1990-05-14' },
  { phone: '+15559876543', name: 'John Smith', dob: '1985-03-22' },
];

// csv/xlsx share the same tabular shape; txt/pdf share the same one-line-per-contact
// shape (pdf has no static TEMPLATES entry since it's server-generated, but is parsed
// the same "best-effort line" way per FORMAT_META's hint); vcard gets its own block.
function FormatFilePreview({ format }: { format: Format }) {
  if (format === 'csv' || format === 'xlsx') {
    return (
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-secondary/60 text-muted-foreground">
              <th className="px-3 py-2 font-semibold">Phone</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Date of Birth</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_CONTACTS.map((c) => (
              <tr key={c.phone} className="border-t border-border">
                <td className="px-3 py-2 text-muted-foreground">{c.phone}</td>
                <td className="px-3 py-2 text-foreground">{c.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.dob}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (format === 'vcard') {
    return (
      <pre className="overflow-x-auto rounded-lg border border-border bg-secondary/30 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {SAMPLE_CONTACTS.map((c) => `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nTEL:${c.phone}\nEND:VCARD`).join('\n')}
      </pre>
    );
  }

  // txt / pdf
  return (
    <div className="space-y-1 rounded-lg border border-border bg-secondary/30 p-3 font-mono text-xs text-muted-foreground">
      {SAMPLE_CONTACTS.map((c) => (
        <div key={c.phone}>
          {c.phone}, {c.name}
        </div>
      ))}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Feature-detected: Chrome/Edge/Samsung Internet on Android only. Safari
// (iOS/macOS) and Firefox have no implementation, so this tab simply never
// renders there - vCard upload is the universal fallback.
function isContactPickerSupported() {
  return typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;
}

export function ImportContactsWizard({
  onImported,
  groupId,
  initialStage = 'choice',
}: {
  onImported?: (result: ImportResult) => void;
  groupId?: string;
  initialStage?: 'choice' | 'format';
}) {
  const entity = useEntityLabels();
  const fileInput = useRef<HTMLInputElement>(null);
  const pickerSupported = useMemo(isContactPickerSupported, []);

  const [stage, setStage] = useState<Stage>(initialStage);
  const [format, setFormat] = useState<Format | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileLabel, setFileLabel] = useState('');
  const [importMethod, setImportMethod] = useState<ImportMethod>('file_upload');
  const [rawRows, setRawRows] = useState<PreviewRow[] | null>(null);
  const [skippedCount, setSkippedCount] = useState(0);
  const [batches, setBatches] = useState<ImportBatch[] | null>(null);
  const notifiedRef = useRef(false);
  const [groupPromptDismissed, setGroupPromptDismissed] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const existingPhones = useQuery({
    queryKey: ['contacts', 'phones'],
    queryFn: fetchContactPhones,
    enabled: stage === 'preview',
    staleTime: 60_000,
  });

  const rows = useMemo(
    () => (rawRows ? annotateDuplicates(rawRows, new Set(existingPhones.data ?? [])) : []),
    [rawRows, existingPhones.data]
  );
  const duplicateCount = rows.filter((r) => r.duplicateType).length;

  const preview = useMutation({
    mutationFn: (file: File) => previewImportFile(file, format as ImportFileFormat),
    onSuccess: (data) => {
      if (!data.rows.length) {
        toast.error('No contacts were found in that file.');
        return;
      }
      setRawRows(data.rows);
      setSkippedCount(data.errors.length);
      setStage('preview');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not read that file.')),
  });

  // Pasted text is parsed through the exact same server-side "txt" line parser as an
  // uploaded .txt file (see FORMAT_META.txt) - hardcoded here rather than going through
  // the shared `preview` mutation above, which reads `format` from state: calling
  // setFormat('txt') and preview.mutate() in the same handler would still close over
  // this render's (stale) `format` value, not the one just set.
  const pastePreview = useMutation({
    mutationFn: (text: string) => previewImportFile(new File([text], 'pasted-contacts.txt', { type: 'text/plain' }), 'txt'),
    onSuccess: (data) => {
      if (!data.rows.length) {
        toast.error('No contacts were found in that text.');
        return;
      }
      setFormat('txt');
      setFileLabel('Pasted list');
      setImportMethod('copy_paste');
      setRawRows(data.rows);
      setSkippedCount(data.errors.length);
      setStage('preview');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not read that text.')),
  });

  const allBatchesDone = batches !== null && batches.every((b) => b.status === 'success' || b.status === 'error');

  // Combines every batch's ImportResult into one, once all of them have settled -
  // there's no single ImportResult from the server once a file is split into more
  // than one confirm request, so the wizard reconstructs the same shape here.
  const aggregateResult = useMemo<ImportResult | null>(() => {
    if (!batches || !allBatchesDone) return null;
    return batches.reduce<ImportResult>(
      (acc, b) =>
        b.status === 'success' && b.result
          ? {
              imported: acc.imported + b.result.imported,
              skipped: acc.skipped + b.result.skipped,
              errors: [...acc.errors, ...b.result.errors],
              contactIds: [...acc.contactIds, ...b.result.contactIds],
            }
          : acc,
      { imported: 0, skipped: 0, errors: [], contactIds: [] }
    );
  }, [batches, allBatchesDone]);

  // Fires once, when every batch has settled - a plain effect (rather than doing this
  // inline at the end of runImport) so it can't double-fire if runImport is ever called
  // again before a reset(), and notifiedRef.current is reset there for the next import.
  useEffect(() => {
    if (!allBatchesDone || !aggregateResult || notifiedRef.current) return;
    notifiedRef.current = true;
    onImported?.(aggregateResult);
    if (aggregateResult.imported > 0) {
      toast.success(`Imported ${aggregateResult.imported} ${aggregateResult.imported === 1 ? entity.singular : entity.plural}.`);
    } else {
      toast.error(`No ${entity.plural} were imported — check the file and try again.`);
    }
  }, [allBatchesDone, aggregateResult, onImported, entity]);

  // Runs one /contacts/import request per batch of up to MAX_IMPORT_ROWS, one at a time
  // (not in parallel) - each batch's status updates live so the UI can show a spinner,
  // then a green check or a red X with that batch's own failure reason, as it finishes.
  async function runImport() {
    const initialBatches: ImportBatch[] = chunkRows(rows, MAX_IMPORT_ROWS).map((batchRows) => ({
      rows: batchRows,
      status: 'pending',
    }));
    notifiedRef.current = false;
    setBatches(initialBatches);
    setStage('import');

    for (let i = 0; i < initialBatches.length; i++) {
      setBatches((prev) => prev!.map((b, idx) => (idx === i ? { ...b, status: 'uploading' } : b)));
      try {
        const data = await importContacts(initialBatches[i].rows, groupId, importMethod);
        setBatches((prev) => prev!.map((b, idx) => (idx === i ? { ...b, status: 'success', result: data } : b)));
      } catch (err) {
        const errorMessage = apiErrorMessage(err, 'Could not import this batch.');
        setBatches((prev) => prev!.map((b, idx) => (idx === i ? { ...b, status: 'error', errorMessage } : b)));
      }
    }
  }

  const template = useMutation({
    mutationFn: (templateFormat: 'xlsx' | 'pdf') => fetchImportTemplateFile(templateFormat),
    onSuccess: (blob, templateFormat) => downloadBlob(blob, `contacts-template.${templateFormat}`),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not download the template.')),
  });

  function downloadTemplate() {
    if (!format) return;
    const staticTemplate = TEMPLATES[format];
    if (staticTemplate) {
      downloadBlob(new Blob([staticTemplate.content], { type: staticTemplate.type }), staticTemplate.filename);
      return;
    }
    if (format === 'xlsx' || format === 'pdf') template.mutate(format);
  }

  function reset() {
    setStage(initialStage);
    setFormat(null);
    setRawRows(null);
    setSkippedCount(0);
    setBatches(null);
    notifiedRef.current = false;
    setGroupPromptDismissed(false);
    setPastedText('');
    setImportMethod('file_upload');
  }

  function chooseFormat(next: Format) {
    setFormat(next);
    setStage('upload');
  }

  function handleFile(picked: File) {
    setFileLabel(picked.name);
    setImportMethod('file_upload');
    if (format === 'vcard') {
      picked
        .text()
        .then((text) => {
          const parsed = parseVCard(text).filter((r) => r.name || r.phone);
          if (!parsed.length) {
            toast.error('No contacts found in that vCard file.');
            return;
          }
          setRawRows(parsed);
          setSkippedCount(0);
          setStage('preview');
        })
        .catch(() => toast.error('Could not read that file. Make sure it is a valid vCard (.vcf).'));
      return;
    }
    preview.mutate(picked);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) handleFile(picked);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  }

  async function importFromDevice() {
    if (!navigator.contacts) return;
    try {
      const picked = await navigator.contacts.select(['name', 'tel'], { multiple: true });
      const parsed: PreviewRow[] = picked
        .map((c) => ({ name: c.name?.[0] ?? '', phone: c.tel?.[0] ?? '', dateOfBirth: '' }))
        .filter((r) => r.name || r.phone);
      if (!parsed.length) return;
      setFileLabel('Phone contacts');
      setImportMethod('phone_contacts');
      setRawRows(parsed);
      setSkippedCount(0);
      setStage('preview');
    } catch {
      // User cancelled the picker, or the browser denied the request - either
      // way there's nothing to report as an error.
    }
  }

  function removeDuplicates() {
    const removed = duplicateCount;
    setRawRows((current) => (current ?? []).filter((_, i) => !rows[i]?.duplicateType));
    toast.success(`Removed ${removed} duplicate${removed === 1 ? '' : 's'}.`);
  }

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
      {stage === 'choice' && (
        <div>
          <div className="mb-3.5 sm:mb-5">
            <div className="mb-1 text-lg font-bold text-foreground/80">Add {entity.plural}</div>
            <div className="text-sm text-muted-foreground">Bring in a file, or let people add themselves.</div>
          </div>
          {/* Row layout on mobile (icon beside the text) instead of the sm+ stacked-card
              layout - keeps all three options, the dialog's close icon, and its footer
              button all in view together on short phone screens without scrolling. */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
            <button
              type="button"
              onClick={() => setStage('format')}
              className="flex flex-row items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/30 sm:flex-col sm:items-start sm:gap-2.5 sm:p-5"
            >
              <UploadIcon className="h-5 w-5 shrink-0 text-muted-foreground sm:h-6 sm:w-6" />
              <div className="min-w-0">
                <div className="text-sm font-semibold sm:text-base">Import {entity.plural}</div>
                <div className="text-xs text-muted-foreground sm:text-sm">Upload a file from your device.</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setStage('paste')}
              className="flex flex-row items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/30 sm:flex-col sm:items-start sm:gap-2.5 sm:p-5"
            >
              <ClipboardPaste className="h-5 w-5 shrink-0 text-muted-foreground sm:h-6 sm:w-6" />
              <div className="min-w-0">
                <div className="text-sm font-semibold sm:text-base">Paste a list</div>
                <div className="text-xs text-muted-foreground sm:text-sm">Copy and paste numbers directly.</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setStage('share')}
              className="flex flex-row items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/30 sm:flex-col sm:items-start sm:gap-2.5 sm:p-5"
            >
              <Share2 className="h-5 w-5 shrink-0 text-muted-foreground sm:h-6 sm:w-6" />
              <div className="min-w-0">
                <div className="text-sm font-semibold sm:text-base">Share a sign-up link</div>
                <div className="text-xs text-muted-foreground sm:text-sm">Let people add themselves.</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {stage === 'paste' && (
        <div>
          <button
            type="button"
            onClick={() => setStage('choice')}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="mb-4">
            <div className="mb-1 text-lg font-bold text-foreground/80">Paste a list of {entity.plural}</div>
            <div className="text-sm text-muted-foreground">One per line - phone number and name, separated by a comma.</div>
          </div>
          <Textarea
            autoFocus
            rows={8}
            placeholder={'+15551234567, Jane Doe\n+15559876543, John Smith'}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="font-mono text-sm"
          />
          <div className="mt-3.5">
            <div className="mb-1.5 text-xs font-semibold text-muted-foreground">What this should look like</div>
            <FormatFilePreview format="txt" />
            <div className="mt-2 text-xs text-muted-foreground">
              Only the phone number is required — name and date of birth are optional.
            </div>
          </div>
          <Button
            className="mt-4 w-full sm:w-auto"
            disabled={!pastedText.trim() || pastePreview.isPending}
            onClick={() => pastePreview.mutate(pastedText)}
          >
            {pastePreview.isPending ? 'Reading…' : 'Preview contacts'}
          </Button>
        </div>
      )}

      {stage === 'share' && (
        <div>
          <button
            type="button"
            onClick={() => setStage('choice')}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <ShareLinkPanel />
        </div>
      )}

      {stage === 'format' && (
        <div>
          {initialStage === 'choice' && (
            <button
              type="button"
              onClick={() => setStage('choice')}
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          <div className="mb-4">
            <div className="mb-1 text-lg font-bold text-foreground/80">Choose a file format</div>
            <div className="text-sm text-muted-foreground">Pick the type of file you'd like to import.</div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {(Object.keys(FORMAT_META) as Format[]).map((key) => {
              const meta = FORMAT_META[key];
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => chooseFormat(key)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-5 text-foreground/80 transition-colors hover:border-primary/50 hover:bg-accent/30"
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-semibold">{meta.label}</span>
                </button>
              );
            })}
          </div>
          {pickerSupported && (
            <Button type="button" variant="outline" className="mt-4 w-full sm:w-auto" onClick={importFromDevice}>
              <Smartphone className="h-3.5 w-3.5" />
              Import from phone contacts
            </Button>
          )}
        </div>
      )}

      {stage === 'upload' && format && (
        <div>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => setStage('format')}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {format !== 'vcard' && (
              <Button type="button" variant="outline" size="sm" disabled={template.isPending} onClick={downloadTemplate}>
                <Download className="h-3.5 w-3.5" />
                {template.isPending ? 'Downloading…' : 'Template'}
              </Button>
            )}
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInput.current?.click()}
            className={cn(
              'flex min-h-[180px] cursor-pointer flex-col justify-center gap-2.5 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
              dragging ? 'border-primary bg-accent/40' : 'border-border bg-secondary/40 hover:border-primary/50',
              preview.isPending && 'pointer-events-none opacity-60'
            )}
          >
            <input ref={fileInput} type="file" accept={FORMAT_META[format].accept} className="hidden" onChange={handleFileInput} />
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="text-base font-semibold">
              {preview.isPending ? 'Reading file…' : `Drag and drop a ${FORMAT_META[format].label} file here`}
            </div>
            <div className="text-sm text-muted-foreground">
              {preview.isPending
                ? 'This can take a moment for larger files.'
                : `or click to browse — ${FORMAT_META[format].hint} · large files are imported automatically in batches of ${MAX_IMPORT_ROWS.toLocaleString()}`}
            </div>
          </div>
          <div className="mt-3.5">
            <div className="mb-1.5 text-xs font-semibold text-muted-foreground">What your file should look like</div>
            <FormatFilePreview format={format} />
            <div className="mt-2 text-xs text-muted-foreground">
              Only the phone number is required — name and date of birth are optional.
            </div>
          </div>
        </div>
      )}

      {stage === 'preview' && rawRows && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3.5 py-2.5">
            <div className="flex min-w-0 items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{fileLabel}</span>
              <span className="shrink-0 text-sm font-normal text-muted-foreground">
                · {rows.length} row{rows.length === 1 ? '' : 's'}
              </span>
            </div>
            <button type="button" onClick={reset} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {skippedCount > 0 && (
            <div className="mb-3 text-sm text-muted-foreground">
              {skippedCount} row{skippedCount === 1 ? '' : 's'} skipped — missing a phone number.
            </div>
          )}

          {rows.length > MAX_IMPORT_ROWS && (
            <div className="mb-3 rounded-lg border border-border bg-secondary/40 px-3.5 py-2.5 text-sm text-muted-foreground">
              FlockText imports up to {MAX_IMPORT_ROWS.toLocaleString()} {entity.plural} at a time — this will run automatically as{' '}
              {Math.ceil(rows.length / MAX_IMPORT_ROWS)} batches, one after another.
            </div>
          )}

          <div className="mb-3">
            <ImportPreviewTable rows={rows} duplicateCount={duplicateCount} onRemoveDuplicates={removeDuplicates} entitySingular={entity.singular} />
          </div>

          <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setStage('format')}>
              Choose a different source
            </Button>
            <Button className="w-full sm:w-auto" disabled={rows.length === 0} onClick={runImport}>
              Import {rows.length} {rows.length === 1 ? entity.singular : entity.plural}
            </Button>
          </div>
        </div>
      )}

      {stage === 'import' && batches && (
        <div>
          {batches.length > 1 && (
            <div className="mb-4 space-y-2">
              <div className="text-sm font-semibold">
                Importing {batches.reduce((sum, b) => sum + b.rows.length, 0)} {entity.plural} in {batches.length} batches…
              </div>
              {batches.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3.5 py-2.5 text-sm"
                >
                  <span className="min-w-0 truncate">
                    Batch {i + 1} of {batches.length} — {b.rows.length} {b.rows.length === 1 ? entity.singular : entity.plural}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {b.status === 'pending' && <span className="text-muted-foreground">Waiting…</span>}
                    {b.status === 'uploading' && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                      </span>
                    )}
                    {b.status === 'success' && (
                      <span className="flex items-center gap-1.5 text-success">
                        <CheckCircle2 className="h-4 w-4" /> {b.result?.imported ?? 0} imported
                      </span>
                    )}
                    {b.status === 'error' && (
                      <span className="flex items-center gap-1.5 text-destructive" title={b.errorMessage}>
                        <XCircle className="h-4 w-4" /> {b.errorMessage}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!allBatchesDone && batches.length === 1 && (
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing {batches[0].rows.length} {batches[0].rows.length === 1 ? entity.singular : entity.plural}…
            </div>
          )}

          {allBatchesDone && aggregateResult && (
            <>
              <div className="mb-2 text-base">
                <span className="font-semibold text-success">{aggregateResult.imported} imported</span>
                {', '}
                <span className="text-muted-foreground">{aggregateResult.skipped} skipped</span>
                {aggregateResult.errors.length > 0 ? `, ${aggregateResult.errors.length} row(s) had errors.` : '.'}
              </div>
              {aggregateResult.errors.length > 0 && (
                <div className="mb-3 max-h-[140px] overflow-auto rounded-lg border border-border">
                  {aggregateResult.errors.map((e, i) => (
                    <div key={i} className="border-b border-border px-3.5 py-2 text-sm text-muted-foreground last:border-b-0">
                      {e.row ? `Row ${e.row}: ` : ''}
                      {e.reason}
                    </div>
                  ))}
                </div>
              )}

              {aggregateResult.imported > 0 && !groupId && !groupPromptDismissed && (
                <ImportGroupPrompt contactIds={aggregateResult.contactIds} onDone={() => setGroupPromptDismissed(true)} />
              )}

              <Button variant="outline" className="mt-4 w-full sm:w-auto" onClick={reset}>
                Import another file
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';
import { UploadCloud, FileText, X, Download, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { importContactsCsv, fetchContactPhones, type ImportResult } from '@/api/contacts';
import { apiErrorMessage } from '@/api/client';
import { cn } from '@/lib/utils';
import { useEntityLabels } from '@/lib/terminology';

const HEADER_ALIASES: Record<string, string[]> = {
  name: ['name', 'full name'],
  firstName: ['first name', 'firstname'],
  lastName: ['last name', 'lastname'],
  phone: ['phone', 'phone number', 'mobile'],
  dateOfBirth: ['date of birth', 'dob', 'birthday'],
};

interface PreviewRow {
  name: string;
  phone: string;
  dateOfBirth: string;
}

type DuplicateType = 'file' | 'existing' | null;

interface ImportRow extends PreviewRow {
  duplicateType: DuplicateType;
}

function mapRow(row: Record<string, string>): PreviewRow {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const headerKey = key.trim().toLowerCase();
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(headerKey)) normalized[field] = String(value || '').trim();
    }
  }
  return {
    name: normalized.name || `${normalized.firstName || ''} ${normalized.lastName || ''}`.trim(),
    phone: normalized.phone || '',
    dateOfBirth: normalized.dateOfBirth || '',
  };
}

function normalizePhoneDigits(phone: string) {
  return phone.replace(/\D/g, '');
}

function annotateDuplicates(rows: PreviewRow[], existingPhones: Set<string>): ImportRow[] {
  const seen = new Set<string>();
  return rows.map((row) => {
    const digits = normalizePhoneDigits(row.phone);
    let duplicateType: DuplicateType = null;
    if (digits) {
      if (seen.has(digits)) duplicateType = 'file';
      else if (existingPhones.has(digits)) duplicateType = 'existing';
      seen.add(digits);
    }
    return { ...row, duplicateType };
  });
}

function downloadTemplate() {
  const csv = 'Name,Phone,Date of Birth\nJane Doe,+15551234567,1990-05-14\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'contacts-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

const PREVIEW_LIMIT = 20;

export function CsvImportPanel({
  onImported,
  groupId,
}: {
  onImported?: (result: ImportResult) => void;
  groupId?: string;
}) {
  const entity = useEntityLabels();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<PreviewRow[] | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const existingPhones = useQuery({
    queryKey: ['contacts', 'phones'],
    queryFn: fetchContactPhones,
    enabled: !!file,
    staleTime: 60_000,
  });

  const rows = useMemo(
    () => (rawRows ? annotateDuplicates(rawRows, new Set(existingPhones.data ?? [])) : []),
    [rawRows, existingPhones.data]
  );
  const preview = rows.slice(0, PREVIEW_LIMIT);
  const totalRows = rows.length;
  const duplicateCount = rows.filter((r) => r.duplicateType).length;

  const upload = useMutation({
    mutationFn: (uploadedFile: File) => importContactsCsv(uploadedFile, groupId),
    onSuccess: (data) => {
      setResult(data);
      onImported?.(data);
      if (data.imported > 0) {
        toast.success(`Imported ${data.imported} ${data.imported === 1 ? entity.singular : entity.plural}.`);
      } else {
        toast.error(`No ${entity.plural} were imported — check the file and try again.`);
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not import that file.')),
  });

  function parseFile(picked: File) {
    setFile(picked);
    setResult(null);
    Papa.parse<Record<string, string>>(picked, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRawRows(results.data.map(mapRow).filter((r) => r.name || r.phone));
      },
      error: () => {
        toast.error('Could not read that file. Make sure it is a valid CSV.');
        setFile(null);
      },
    });
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) parseFile(picked);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) parseFile(dropped);
  }

  function reset() {
    setFile(null);
    setRawRows(null);
    setResult(null);
  }

  function removeDuplicates() {
    const removed = duplicateCount;
    setRawRows((current) => (current ?? []).filter((_, i) => !rows[i]?.duplicateType));
    toast.success(`Removed ${removed} duplicate${removed === 1 ? '' : 's'}.`);
  }

  function submitImport() {
    if (!file) return;
    const csv = Papa.unparse(rows.map((r) => ({ Name: r.name, Phone: r.phone, 'Date of Birth': r.dateOfBirth })));
    upload.mutate(new File([csv], file.name, { type: 'text/csv' }));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 text-[13px] font-bold text-foreground/80">Upload a CSV</div>
          <div className="text-xs text-muted-foreground">
            Columns: name (or first/last name), phone, and optionally date of birth.
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={downloadTemplate}>
          <Download className="h-3.5 w-3.5" />
          Template
        </Button>
      </div>

      {!file && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
          className={cn(
            'flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
            dragging ? 'border-primary bg-accent/40' : 'border-border bg-secondary/40 hover:border-primary/50'
          )}
        >
          <input ref={fileInput} type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold">Drag and drop your CSV here</div>
          <div className="text-xs text-muted-foreground">or click to browse files</div>
        </div>
      )}

      {file && rawRows && !result && (
        <div>
          <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {file.name}
              <span className="font-normal text-muted-foreground">· {totalRows} row{totalRows === 1 ? '' : 's'}</span>
            </div>
            <button type="button" onClick={reset} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {duplicateCount > 0 && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-warning">
                <TriangleAlert className="h-4 w-4 shrink-0" />
                {duplicateCount} duplicate phone number{duplicateCount === 1 ? '' : 's'} found — repeated in the file or already in your{' '}
                {entity.plural}.
              </div>
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={removeDuplicates}>
                Remove duplicates
              </Button>
            </div>
          )}

          <div className="mb-3 max-h-[280px] overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date of birth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row, i) => (
                  <TableRow key={i} className={cn(row.duplicateType && 'bg-warning/10')}>
                    <TableCell className={cn('font-semibold', !row.name && 'text-destructive')}>{row.name || 'Missing'}</TableCell>
                    <TableCell className={cn('text-muted-foreground', !row.phone && 'text-destructive')}>
                      <span className="inline-flex items-center gap-1.5">
                        {row.phone || 'Missing'}
                        {row.duplicateType === 'file' && (
                          <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
                            Duplicate in file
                          </Badge>
                        )}
                        {row.duplicateType === 'existing' && (
                          <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
                            Already a {entity.singular}
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.dateOfBirth || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalRows > PREVIEW_LIMIT && (
              <div className="border-t border-border px-3.5 py-2 text-xs text-muted-foreground">
                +{totalRows - PREVIEW_LIMIT} more row{totalRows - PREVIEW_LIMIT === 1 ? '' : 's'}
              </div>
            )}
          </div>

          <div className="flex gap-2.5">
            <Button variant="outline" onClick={reset} disabled={upload.isPending}>
              Choose a different file
            </Button>
            <Button className="flex-1" disabled={upload.isPending || totalRows === 0} onClick={submitImport}>
              {upload.isPending ? 'Importing…' : `Import ${totalRows} ${totalRows === 1 ? entity.singular : entity.plural}`}
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div>
          <div className="mb-2 text-sm">
            <span className="font-semibold text-success">{result.imported} imported</span>
            {', '}
            <span className="text-muted-foreground">{result.skipped} skipped</span>
            {result.errors.length > 0 ? `, ${result.errors.length} row(s) had errors.` : '.'}
          </div>
          {result.errors.length > 0 && (
            <div className="mb-3 max-h-[140px] overflow-auto rounded-lg border border-border">
              {result.errors.map((e, i) => (
                <div key={i} className="border-b border-border px-3.5 py-2 text-xs text-muted-foreground last:border-b-0">
                  Row {e.row}: {e.reason}
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={reset}>
            Import another file
          </Button>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { cn } from '@/lib/utils';
import { displayName } from '@/lib/name';
import type { ImportRow } from '@/lib/contactImport';

const PAGE_SIZE = 100;

export function ImportPreviewTable({
  rows,
  duplicateCount,
  onRemoveDuplicates,
  entitySingular,
}: {
  rows: ImportRow[];
  duplicateCount: number;
  onRemoveDuplicates: () => void;
  entitySingular: string;
}) {
  const [page, setPage] = useState(1);
  const totalRows = rows.length;
  // Clamped rather than reset via an effect - "Remove duplicates" can shrink
  // `rows` out from under whatever page was showing, so this just derives a
  // page that's always in range instead of needing to react to that shrink.
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const preview = rows.slice(start, start + PAGE_SIZE);

  return (
    <div>
      {duplicateCount > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-warning">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {duplicateCount} duplicate phone number{duplicateCount === 1 ? '' : 's'} found — repeated in the file or already on file.
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onRemoveDuplicates}>
            Remove duplicates
          </Button>
        </div>
      )}

      <div className="max-h-110 overflow-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-sm">Phone</TableHead>
              <TableHead className="text-sm">Name</TableHead>
              <TableHead className="text-sm">Date of birth</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((row, i) => (
              <TableRow key={start + i} className={cn(row.duplicateType && 'bg-warning/10')}>
                <TableCell className={cn('font-semibold', !row.phone && 'text-destructive')}>
                  <span className="inline-flex items-center gap-1.5">
                    {row.phone || 'Missing'}
                    {row.duplicateType === 'file' && (
                      <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
                        Duplicate in file
                      </Badge>
                    )}
                    {row.duplicateType === 'existing' && (
                      <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
                        Already a {entitySingular}
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{displayName(row.name, row.phone) || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{row.dateOfBirth || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls page={currentPage} total={totalRows} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { CsvImportPanel } from '@/components/contacts/CsvImportPanel';
import { ShareLinkPanel } from '@/components/contacts/ShareLinkPanel';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { fetchContacts } from '@/api/contacts';
import { useAuthStore } from '@/store/authStore';
import { useEntityLabels } from '@/lib/terminology';
import type { DateRangeParams } from '@/lib/dateRange';

export function ContactsPage() {
  const queryClient = useQueryClient();
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const entity = useEntityLabels();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [range, setRange] = useState<DateRangeParams>({ preset: 'all_time' });
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const contacts = useQuery({
    queryKey: ['contacts', search, range],
    queryFn: () => fetchContacts(search || undefined, range),
  });

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[26px] font-bold">{entity.pluralCap}</div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            Showing {contacts.data?.length ?? 0} {entity.plural}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Button
            variant={"outline"}
            className="gap-1 px-2.5 py-1.5 text-xs sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
            onClick={() => setShowImport(true)}
          >
            <Upload className="h-3.5 w-3.5 sm:h-[15px] sm:w-[15px]" /> Import
          </Button>
          <Button
            className="gap-1 px-2.5 py-1.5 text-xs sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
            onClick={() => setShowAdd((v) => !v)}
          >
            <UserPlus className="h-3.5 w-3.5 sm:h-[15px] sm:w-[15px]" /> Add {entity.singular}
          </Button>
        </div>
      </div>

      <AddContactDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['contacts'] });
          queryClient.invalidateQueries({ queryKey: ['groups'] });
        }}
      />

      <div className="mb-4 flex items-center gap-1.5 sm:flex-wrap sm:gap-2.5">
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or number…"
            className="pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearch(searchInput);
            }}
          />
        </div>
        <Button variant="outline" className="shrink-0 px-2.5 sm:px-4" onClick={() => setSearch(searchInput)}>
          <Search className="h-[15px] w-[15px]" /> <span className="hidden sm:inline">Search</span>
        </Button>
        <DateRangeFilter range={range} onChange={setRange} includeAllTime compactOnMobile />
        {search && (
          <Button
            variant="ghost"
            className="shrink-0 px-2.5 sm:px-4"
            onClick={() => {
              setSearch('');
              setSearchInput('');
            }}
          >
            <X className="h-[15px] w-[15px]" /> <span className="hidden sm:inline">Reset</span>
          </Button>
        )}
      </div>

      <ContactsTable
        contacts={contacts.data}
        isLoading={contacts.isLoading}
        emptyMessage={`No ${entity.plural} yet. Add your first one above.`}
      />

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import {entity.plural}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <CsvImportPanel
              onImported={(result) => {
                if (result.imported > 0) {
                  updateOrganization({ contactsStatus: 'done' });
                  queryClient.invalidateQueries({ queryKey: ['contacts'] });
                  queryClient.invalidateQueries({ queryKey: ['groups'] });
                }
              }}
            />
            <ShareLinkPanel />
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}

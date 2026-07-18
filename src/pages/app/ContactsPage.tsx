import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CsvImportPanel } from '@/components/contacts/CsvImportPanel';
import { ShareLinkPanel } from '@/components/contacts/ShareLinkPanel';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { fetchContacts } from '@/api/contacts';
import { useAuthStore } from '@/store/authStore';
import { useEntityLabels } from '@/lib/terminology';

export function ContactsPage() {
  const queryClient = useQueryClient();
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const entity = useEntityLabels();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const contacts = useQuery({ queryKey: ['contacts', search], queryFn: () => fetchContacts(search || undefined) });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold">{entity.pluralCap}</div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            Showing {contacts.data?.length ?? 0} {entity.plural}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant={"outline"} onClick={() => setShowImport(true)}>
            <Upload className="h-[15px] w-[15px]" /> Import
          </Button>
          <Button onClick={() => setShowAdd((v) => !v)}>
            <UserPlus className="h-[15px] w-[15px]" /> Add {entity.singular}
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

      <div className="mb-4 flex items-center gap-2.5">
        <div className="relative flex-1">
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
        <Button variant="outline" onClick={() => setSearch(searchInput)}>
          <Search className="h-[15px] w-[15px]" /> Search
        </Button>
        {search && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setSearchInput('');
            }}
          >
            <X className="h-[15px] w-[15px]" /> Reset
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

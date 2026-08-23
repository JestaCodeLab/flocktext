import { Pencil, Trash2, UserMinus, Phone, Users as UsersIcon, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/name';
import type { Contact } from '@/api/contacts';

// Mobile counterpart to the desktop table's inline edit/delete icon buttons -
// tapping a row in the mobile list view opens this instead of a table row.
export function ContactDetailDialog({
  contact,
  onOpenChange,
  onEdit,
  onDelete,
  onRemoveFromGroup,
}: {
  contact: Contact | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onRemoveFromGroup?: (contact: Contact) => void;
}) {
  return (
    <Dialog open={!!contact} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {contact && (
          <>
            <DialogHeader>
              <div className="flex flex-col items-center gap-2.5 pt-1 text-center">
                <Avatar size="lg" className="h-14 w-14">
                  <AvatarFallback className="bg-chart-4/15 text-base font-semibold text-chart-4">
                    {getInitials(contact.name)}
                  </AvatarFallback>
                </Avatar>
                <DialogTitle className="text-lg">{contact.name}</DialogTitle>
              </div>
            </DialogHeader>

            <div className="divide-y divide-border rounded-xl border border-border">
              <div className="flex items-center gap-3 px-3.5 py-3">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground">Phone</div>
                  <div className="truncate text-sm font-medium">{contact.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3.5 py-3">
                <UsersIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground">Groups</div>
                  <div className="truncate text-sm font-medium">{contact.groupsText || '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3.5 py-3">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground">Added</div>
                  <div className="truncate text-sm font-medium">
                    {new Date(contact.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1" onClick={() => onEdit(contact)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              {onRemoveFromGroup && (
                <Button variant="outline" className="flex-1" onClick={() => onRemoveFromGroup(contact)}>
                  <UserMinus className="h-4 w-4" /> Remove
                </Button>
              )}
              <Button variant="destructive" className="flex-1" onClick={() => onDelete(contact)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

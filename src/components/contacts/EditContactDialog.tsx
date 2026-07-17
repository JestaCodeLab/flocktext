import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { updateContact, type Contact } from '@/api/contacts';
import { apiErrorMessage } from '@/api/client';
import { formatPhoneInput } from '@/lib/phone';
import { splitName } from '@/lib/name';

export function EditContactDialog({
  contact,
  onOpenChange,
  onUpdated,
}: {
  contact: Contact | null;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (contact: Contact) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  useEffect(() => {
    if (contact) {
      // Contacts added before firstName/lastName were captured only have `name` -
      // fall back to splitting it so the fields aren't blank when editing them.
      const fallback = splitName(contact.name);
      setFirstName(contact.firstName || fallback.firstName);
      setLastName(contact.lastName || fallback.lastName);
      setPhone(contact.phone);
      setDateOfBirth(contact.dateOfBirth ? contact.dateOfBirth.slice(0, 10) : '');
    }
  }, [contact]);

  const saveContact = useMutation({
    mutationFn: (payload: { firstName: string; lastName?: string; phone: string; dateOfBirth?: string }) =>
      updateContact(contact!.id, payload),
    onSuccess: (updated) => {
      onOpenChange(false);
      onUpdated?.(updated);
      toast.success('Contact updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSubmit() {
    if (!firstName || !phone) {
      toast.error('First name and phone are required.');
      return;
    }
    saveContact.mutate({ firstName, lastName: lastName || undefined, phone, dateOfBirth: dateOfBirth || undefined });
  }

  return (
    <Dialog open={!!contact} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-contact-first-name">First name</Label>
              <Input id="edit-contact-first-name" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact-last-name">Last name</Label>
              <Input id="edit-contact-last-name" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-contact-phone">Phone</Label>
            <Input
              id="edit-contact-phone"
              placeholder="024 xxx xxxx"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-contact-dob">Date of birth (optional)</Label>
            <Input id="edit-contact-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saveContact.isPending} onClick={handleSubmit}>
            {saveContact.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

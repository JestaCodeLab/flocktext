import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createContact, type Contact } from '@/api/contacts';
import { apiErrorMessage } from '@/api/client';
import { formatPhoneInput } from '@/lib/phone';

export function AddContactDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (contact: Contact) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  function reset() {
    setFirstName('');
    setLastName('');
    setPhone('');
    setDateOfBirth('');
  }

  const addContact = useMutation({
    mutationFn: createContact,
    onSuccess: (contact) => {
      reset();
      onOpenChange(false);
      onCreated?.(contact);
      toast.success(`${contact.name} added.`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSubmit() {
    if (!firstName || !phone) {
      toast.error('First name and phone are required.');
      return;
    }
    addContact.mutate({ firstName, lastName: lastName || undefined, phone, dateOfBirth: dateOfBirth || undefined });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contact-first-name">First name</Label>
              <Input id="contact-first-name" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-last-name">Last name</Label>
              <Input id="contact-last-name" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input
              id="contact-phone"
              placeholder="024 xxx xxxx"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-dob">Date of birth (optional)</Label>
            <Input id="contact-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={addContact.isPending} onClick={handleSubmit}>
            {addContact.isPending ? 'Saving…' : 'Save contact'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

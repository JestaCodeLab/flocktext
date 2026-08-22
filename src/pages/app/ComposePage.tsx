import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Send, CalendarClock, Repeat, Plus, Check, Info, TriangleAlert, CircleAlert, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddSenderIdDialog } from '@/components/organization/AddSenderIdDialog';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { fetchGroups, fetchContactsCount, fetchContacts, type Contact } from '@/api/contacts';
import { fetchTemplates } from '@/api/templates';
import { sendMessage, scheduleMessage, type RecurringFreq, type RecipientType } from '@/api/messages';
import { fetchEffectiveSenderId } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { senderIdStatusLabel, senderIdStatusVariant } from '@/lib/senderIdStatus';
import { Badge } from '@/components/ui/badge';
import { formatPhoneInput, normalizePhone } from '@/lib/phone';
import { cn } from '@/lib/utils';
import { useEntityLabels } from '@/lib/terminology';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Matches VARIABLE_PATTERN / personalize() in api/services/messageSender.js exactly -
// these are the only tokens the backend actually replaces per recipient.
const MESSAGE_VARIABLES = [
  { token: '{firstName}', label: 'First name' },
  { token: '{lastName}', label: 'Last name' },
  { token: '{name}', label: 'Full name' },
  { token: '{orgName}', label: 'Org name' },
];

interface ReadinessCheck {
  key: string;
  /** 'blocked' prevents sending; 'warning' is advisory and still lets it through. */
  status: 'ok' | 'warning' | 'blocked';
  message: string;
  /** Shown on the send button itself when this is the first unmet requirement. */
  buttonLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function countSegments(body: string) {
  return Math.max(1, Math.ceil(body.length / 160));
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function ComposePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const preset = location.state as {
    templateId?: string;
    body?: string;
    recipientMode?: 'single';
    phone?: string;
    recipientName?: string;
  } | null;
  const queryClient = useQueryClient();
  const entity = useEntityLabels();
  const session = useAuthStore((s) => s.session);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);

  const [recipientMode, setRecipientMode] = useState<'single' | 'groups' | 'all'>(preset?.recipientMode ?? 'single');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  // contactSearchInput updates on every keystroke (so the box itself feels responsive);
  // contactSearch only catches up 300ms after typing pauses, and is what actually drives
  // the query - without this, an org with hundreds of contacts fires one network request
  // per keystroke, and an empty search fetches every contact unfiltered.
  const [contactSearchInput, setContactSearchInput] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  // Multiple contacts can be searched for and added one at a time - the search box
  // stays open after each pick so the next one can be found right away.
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  // Numbers not in the address book can be added to the same send alongside searched
  // contacts - kept separate from selectedContacts since these aren't Contact records.
  // Preset navigation (e.g. "Message this contact" elsewhere in the app) already hands us
  // a resolved phone/name, so it's seeded in here rather than needing its own entry mode.
  const [manualRecipients, setManualRecipients] = useState<{ phone: string; name: string }[]>(
    preset?.phone ? [{ phone: preset.phone, name: preset.recipientName ?? '' }] : []
  );
  const [manualAddPhone, setManualAddPhone] = useState('');
  const [manualAddName, setManualAddName] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'once' | 'recurring'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [recurringFreq, setRecurringFreq] = useState<RecurringFreq>('daily');
  const [recurringTime, setRecurringTime] = useState('09:00');
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState(1);
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState(1);

  const [templateId, setTemplateId] = useState(preset?.templateId ?? '');
  const [body, setBody] = useState(preset?.body ?? '');
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAddSenderId, setShowAddSenderId] = useState(false);
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setContactSearch(contactSearchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [contactSearchInput]);

  const groups = useQuery({ queryKey: ['groups'], queryFn: fetchGroups });
  const templates = useQuery({ queryKey: ['templates'], queryFn: fetchTemplates });
  const contactsCount = useQuery({ queryKey: ['contacts-count'], queryFn: fetchContactsCount });
  // Never fetches on an empty search - an org with hundreds of contacts would otherwise
  // dump its entire, unfiltered contact list into a 220px scrollable box the moment this
  // tab opens. contactSearch is already debounced (see effect above).
  const contactResults = useQuery({
    queryKey: ['contacts', contactSearch],
    queryFn: () => fetchContacts(contactSearch),
    enabled: recipientMode === 'single' && contactSearch.length > 0,
  });
  const MAX_CONTACT_RESULTS = 50;
  // Already-added contacts (via search or a manually-typed number matching the same
  // phone) stay out of the results list so the same person can't be added twice.
  const selectableContactResults = (contactResults.data ?? []).filter(
    (c) =>
      !selectedContacts.some((sc) => sc.id === c.id) &&
      !manualRecipients.some((r) => normalizePhone(r.phone) === normalizePhone(c.phone))
  );
  const shownContactResults = selectableContactResults.slice(0, MAX_CONTACT_RESULTS);
  const hiddenContactResultCount = Math.max(0, selectableContactResults.length - MAX_CONTACT_RESULTS);
  const senderIds = (session?.organization.senderIds ?? []).filter((s) => s.status !== 'deleted');
  const approvedSenderIds = senderIds.filter((s) => s.status === 'approved');
  const approvedSenderId = approvedSenderIds.find((s) => s.isPrimary) ?? approvedSenderIds[0];

  const effectiveSenderId = useQuery({
    queryKey: ['effective-sender-id'],
    queryFn: fetchEffectiveSenderId,
    enabled: !approvedSenderId,
  });
  const effectiveSenderName = approvedSenderId?.senderId || effectiveSenderId.data?.senderId;
  // With an approved sender ID, that's always what gets used, so it's the
  // preselected value and "use system default" isn't offered as a choice.
  const senderSelectValue = selectedSenderId ?? approvedSenderId?.id ?? '';

  // Matches the server's own rule (validators/shared.js requires 9+ digits), so
  // a half-typed number isn't counted as a deliverable recipient.
  const manualAddPhoneValid = normalizePhone(manualAddPhone).length >= 9;

  const recipientCount = useMemo(() => {
    if (recipientMode === 'single') return selectedContacts.length + manualRecipients.length;
    if (recipientMode === 'all') return contactsCount.data ?? 0;
    return groups.data?.find((g) => g.id === selectedGroupId)?.count ?? 0;
  }, [recipientMode, selectedContacts, manualRecipients, groups.data, selectedGroupId, contactsCount.data]);

  const segments = countSegments(body);
  const estimatedCost = segments * recipientCount;

  const walletBalance = session?.organization.walletBalanceCredits ?? 0;

  const recurringSummary = useMemo(() => {
    if (recurringFreq === 'daily') return `Daily at ${recurringTime}`;
    if (recurringFreq === 'weekly') return `Weekly on ${WEEKDAYS[recurringDayOfWeek]} at ${recurringTime}`;
    return `Monthly on the ${ordinal(recurringDayOfMonth)} at ${recurringTime}`;
  }, [recurringFreq, recurringTime, recurringDayOfWeek, recurringDayOfMonth]);

  // Everything that has to be true before this send can go out, evaluated live
  // so the panel explains what's missing instead of the button failing on click.
  // 'blocked' disables sending; 'warning' is advisory only.
  const checks = useMemo<ReadinessCheck[]>(() => {
    const result: ReadinessCheck[] = [];

    // Recipients. The "no contacts" cases only fire once the relevant query has
    // actually resolved - an in-flight count reads as 0 and would otherwise
    // block the button for a moment on every page load.
    if (recipientMode === 'single') {
      const totalContactRecipients = selectedContacts.length + manualRecipients.length;
      if (totalContactRecipients === 0) {
        result.push({
          key: 'recipients',
          status: 'blocked',
          buttonLabel: 'Add a recipient',
          message: `Search or add at least one number to send to.`,
        });
      } else {
        result.push({
          key: 'recipients',
          status: 'ok',
          message: `Sending to ${totalContactRecipients} ${totalContactRecipients === 1 ? entity.singular : entity.plural}`,
        });
      }
    } else if (recipientMode === 'all') {
      if (contactsCount.isSuccess && recipientCount === 0) {
        result.push({
          key: 'recipients',
          status: 'blocked',
          buttonLabel: `No ${entity.plural} to send to`,
          message: `You have no ${entity.plural} yet.`,
          actionLabel: `Add ${entity.plural}`,
          onAction: () => navigate('/app/contacts'),
        });
      } else {
        result.push({ key: 'recipients', status: 'ok', message: `Sending to all ${recipientCount} ${entity.plural}` });
      }
    } else if (!selectedGroupId) {
      result.push({ key: 'recipients', status: 'blocked', buttonLabel: 'Choose a group', message: 'Choose a group to send to.' });
    } else if (groups.isSuccess && recipientCount === 0) {
      result.push({
        key: 'recipients',
        status: 'blocked',
        buttonLabel: 'Group is empty',
        message: `That group has no ${entity.plural} in it yet.`,
        actionLabel: `Add ${entity.plural}`,
        onAction: () => navigate('/app/contacts/groups'),
      });
    } else {
      result.push({ key: 'recipients', status: 'ok', message: `Sending to ${recipientCount} ${entity.plural}` });
    }

    // Message
    if (!body.trim()) {
      result.push({ key: 'message', status: 'blocked', buttonLabel: 'Write a message', message: 'Write the message you want to send.' });
    } else {
      result.push({ key: 'message', status: 'ok', message: `Message written — ${segments} segment${segments === 1 ? '' : 's'}` });
    }

    // Schedule timing
    if (scheduleMode === 'once') {
      const when = scheduleDate && scheduleTime ? new Date(`${scheduleDate}T${scheduleTime}`) : null;
      if (!when) {
        result.push({ key: 'schedule', status: 'blocked', buttonLabel: 'Pick a date and time', message: 'Choose when this should send.' });
      } else if (when <= new Date()) {
        result.push({ key: 'schedule', status: 'blocked', buttonLabel: 'Pick a future time', message: 'That time has already passed — choose a future one.' });
      } else {
        result.push({ key: 'schedule', status: 'ok', message: `Sends ${when.toLocaleString()}` });
      }
    } else if (scheduleMode === 'recurring') {
      result.push({ key: 'schedule', status: 'ok', message: recurringSummary });
    }

    // Credits. Only "Send now" spends them immediately - scheduled and recurring
    // sends reserve at fire time (services/scheduler.js), so a short balance
    // there is a warning to top up in the meantime, not a reason to block.
    const shortfall = estimatedCost - walletBalance;
    if (scheduleMode === 'now') {
      if (shortfall > 0) {
        result.push({
          key: 'credits',
          status: 'blocked',
          buttonLabel: 'Not enough credits',
          message: `Need ${shortfall} more credit${shortfall === 1 ? '' : 's'} — you have ${walletBalance}.`,
          actionLabel: 'Top up',
          onAction: () => navigate('/app/wallet'),
        });
      } else {
        result.push({ key: 'credits', status: 'ok', message: `${estimatedCost} of your ${walletBalance} credits` });
      }
    } else if (shortfall > 0) {
      result.push({
        key: 'credits',
        status: 'warning',
        message:
          scheduleMode === 'recurring'
            ? `Each run costs ~${estimatedCost} credits and you have ${walletBalance} — top up or runs will fail.`
            : `This needs ${estimatedCost} credits and you have ${walletBalance} — top up before it sends.`,
        actionLabel: 'Top up',
        onAction: () => navigate('/app/wallet'),
      });
    } else {
      result.push({
        key: 'credits',
        status: 'ok',
        message:
          scheduleMode === 'recurring'
            ? `~${estimatedCost} credits per run, ${walletBalance} available`
            : `${estimatedCost} of your ${walletBalance} credits`,
      });
    }

    return result;
  }, [
    recipientMode,
    selectedContacts,
    manualRecipients,
    selectedGroupId,
    recipientCount,
    contactsCount.isSuccess,
    groups.isSuccess,
    body,
    segments,
    scheduleMode,
    scheduleDate,
    scheduleTime,
    recurringSummary,
    estimatedCost,
    walletBalance,
    entity,
    navigate,
  ]);

  const blockers = checks.filter((c) => c.status === 'blocked');
  const canSend = blockers.length === 0;

  function resetForm() {
    setBody('');
    setTemplateId('');
    setSelectedGroupId(null);
    setSelectedContacts([]);
    setManualRecipients([]);
    setManualAddPhone('');
    setManualAddName('');
    setContactSearchInput('');
    setContactSearch('');
    setScheduleDate('');
    setScheduleMode('now');
    setSelectedSenderId(null);
  }

  const send = useMutation({
    mutationFn: sendMessage,
    onSuccess: (data) => {
      setShowConfirm(false);
      toast.success(`Sent — ${data.stats.delivered}/${data.stats.total} delivered.`);
      resetForm();
      updateOrganization({ walletBalanceCredits: data.walletBalanceCredits });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      navigate(`/app/reports/${data.id}`);
    },
    onError: (err) => {
      setShowConfirm(false);
      toast.error(apiErrorMessage(err));
    },
  });

  const schedule = useMutation({
    mutationFn: scheduleMessage,
    onSuccess: () => {
      setShowConfirm(false);
      toast.success(scheduleMode === 'once' ? 'Message scheduled.' : 'Recurring send created.');
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages'] });
    },
    onError: (err) => {
      setShowConfirm(false);
      toast.error(apiErrorMessage(err));
    },
  });

  const isPending = send.isPending || schedule.isPending;
  const actionLabel = scheduleMode === 'now' ? 'Send now' : scheduleMode === 'once' ? 'Schedule send' : 'Start recurring send';

  function selectGroup(id: string) {
    setSelectedGroupId((current) => (current === id ? null : id));
  }

  // Adds a number typed by hand to the same recipient list search-picked contacts go
  // into. Dedupes against both sources by digits-only phone, same as the search results
  // filter, so the same person can't end up in the list (and billed) twice.
  function addManualRecipient() {
    const digits = normalizePhone(manualAddPhone);
    if (digits.length < 9) return;
    const alreadyAdded =
      selectedContacts.some((c) => normalizePhone(c.phone) === digits) ||
      manualRecipients.some((r) => normalizePhone(r.phone) === digits);
    if (!alreadyAdded) {
      setManualRecipients((prev) => [...prev, { phone: manualAddPhone.trim(), name: manualAddName.trim() }]);
    }
    setManualAddPhone('');
    setManualAddName('');
  }

  // Inserts at the cursor (not just appended) so this works mid-sentence too, then
  // restores focus and places the cursor right after the inserted token.
  function insertVariable(token: string) {
    const el = messageRef.current;
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + token + body.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + token.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  function handleOpenConfirm() {
    // The button is disabled while anything is blocked, so this is just a
    // backstop for state that changed between render and click.
    if (blockers.length > 0) {
      toast.error(blockers[0].message);
      return;
    }
    setShowConfirm(true);
  }

  function handleConfirm() {
    // Contacts picked via search plus any manually-typed numbers go out together as a
    // "list" send - the server re-matches each phone against existing contacts for
    // personalization, so mixing real contacts and ad-hoc numbers works transparently.
    const basePayload = {
      body,
      recipientType: (recipientMode === 'single' ? 'list' : recipientMode) as RecipientType,
      groupIds: recipientMode === 'groups' && selectedGroupId ? [selectedGroupId] : undefined,
      recipients:
        recipientMode === 'single'
          ? [
            ...selectedContacts.map((c) => ({ phone: c.phone, name: c.name })),
            ...manualRecipients.map((r) => ({ phone: r.phone, name: r.name || undefined })),
          ]
          : undefined,
      templateId: templateId || null,
      senderId: selectedSenderId || undefined,
    };

    if (scheduleMode === 'now') {
      send.mutate(basePayload);
    } else if (scheduleMode === 'once') {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      schedule.mutate({ ...basePayload, sendMode: 'once', scheduleDate: scheduledDateTime.toISOString() });
    } else {
      schedule.mutate({
        ...basePayload,
        sendMode: 'recurring',
        recurringFreq,
        recurringTime,
        recurringDayOfWeek: recurringFreq === 'weekly' ? recurringDayOfWeek : undefined,
        recurringDayOfMonth: recurringFreq === 'monthly' ? recurringDayOfMonth : undefined,
      });
    }
  }

  const selectedSenderIdObj = senderIds.find((s) => s.id === senderSelectValue);
  const effectiveSenderIdForSend = selectedSenderIdObj?.senderId || effectiveSenderName;

  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-[22px] font-bold sm:text-[26px]">Send SMS</div>
        <div className="text-sm text-muted-foreground">Compose and deliver messages to your {entity.plural}.</div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setScheduleMode('now')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm',
            scheduleMode === 'now' ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Send className="h-3.5 w-3.5" /> Send Now
        </button>
        <button
          type="button"
          onClick={() => setScheduleMode('once')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm',
            scheduleMode === 'once' ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <CalendarClock className="h-3.5 w-3.5" /> Schedule
        </button>
        <button
          type="button"
          onClick={() => setScheduleMode('recurring')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm',
            scheduleMode === 'recurring' ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Repeat className="h-3.5 w-3.5" /> Recurring
        </button>
      </div>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="min-w-0 w-full flex-1">
          {(scheduleMode === 'once' || scheduleMode === 'recurring') && (
            <div className="mb-4.5 rounded-xl border border-border bg-card p-5">
              <div className="mb-3.5 text-[15px] font-medium text-foreground/80">Schedule details</div>
              {scheduleMode === 'once' && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1 space-y-1.5">
                    <Label>Date</Label>
                    <DatePicker value={scheduleDate} onChange={setScheduleDate} placeholder="Select date" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label>Time</Label>
                    <TimePicker value={scheduleTime} onChange={setScheduleTime} placeholder="Select time" />
                  </div>
                </div>
              )}

              {scheduleMode === 'recurring' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="recurring-freq">Frequency</Label>
                      <select
                        id="recurring-freq"
                        className="w-full rounded-[9px] border border-border bg-background px-3.5 py-2.5 text-sm"
                        value={recurringFreq}
                        onChange={(e) => setRecurringFreq(e.target.value as RecurringFreq)}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="recurring-time">Time</Label>
                      <Input id="recurring-time" type="time" value={recurringTime} onChange={(e) => setRecurringTime(e.target.value)} />
                    </div>
                  </div>
                  {recurringFreq === 'weekly' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="recurring-day-of-week">Day of week</Label>
                      <select
                        id="recurring-day-of-week"
                        className="w-full rounded-[9px] border border-border bg-background px-3.5 py-2.5 text-sm"
                        value={recurringDayOfWeek}
                        onChange={(e) => setRecurringDayOfWeek(Number(e.target.value))}
                      >
                        {WEEKDAYS.map((d, i) => (
                          <option key={i} value={i}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {recurringFreq === 'monthly' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="recurring-day-of-month">Day of month</Label>
                      <select
                        id="recurring-day-of-month"
                        className="w-full rounded-[9px] border border-border bg-background px-3.5 py-2.5 text-sm"
                        value={recurringDayOfMonth}
                        onChange={(e) => setRecurringDayOfMonth(Number(e.target.value))}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mb-4.5 rounded-xl border border-border bg-card p-5">
            <div className="mb-3.5 flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setRecipientMode('single')}
                  className={cn(
                    'rounded-md px-3 py-1 text-sm font-semibold transition-colors',
                    recipientMode === 'single' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('groups')}
                  className={cn(
                    'rounded-md px-3 py-1 text-sm font-semibold transition-colors',
                    recipientMode === 'groups' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Groups
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('all')}
                  className={cn(
                    'rounded-md px-3 py-1 text-sm font-semibold transition-colors',
                    recipientMode === 'all' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  All
                </button>
              </div>
            </div>

            {recipientMode === 'groups' ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
                {groups.data?.map((g) => {
                  const selected = selectedGroupId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => selectGroup(g.id)}
                      className={cn(
                        'relative flex items-center gap-2.5 rounded-lg border p-3 text-left',
                        selected ? 'border-primary bg-accent/40' : 'border-border bg-background'
                      )}
                    >
                      {selected && (
                        <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <Users className={cn('h-5 w-5 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold leading-tight">{g.name}</div>
                        <div className="text-[12px] text-muted-foreground">{g.count} {entity.plural}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : recipientMode === 'all' ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-primary bg-accent/40 p-3">
                <Users className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold leading-tight">All {entity.pluralCap}</div>
                  <div className="text-[11px] text-muted-foreground">{contactsCount.data ?? 0} {entity.plural}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {(selectedContacts.length > 0 || manualRecipients.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedContacts.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-1.5 rounded-full border border-primary bg-accent/40 py-1 pl-3 pr-1.5 text-xs"
                      >
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-muted-foreground">{c.phone}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedContacts((prev) => prev.filter((sc) => sc.id !== c.id))}
                          className="rounded-full p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {manualRecipients.map((r) => (
                      <div
                        key={r.phone}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 py-1 pl-3 pr-1.5 text-xs"
                      >
                        {r.name && <span className="font-semibold">{r.name}</span>}
                        <span className="text-muted-foreground">{r.phone}</span>
                        <button
                          type="button"
                          onClick={() => setManualRecipients((prev) => prev.filter((mr) => mr.phone !== r.phone))}
                          className="rounded-full p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${entity.plural} by name or phone…`}
                    className="pl-10"
                    value={contactSearchInput}
                    onChange={(e) => setContactSearchInput(e.target.value)}
                    autoFocus
                  />
                </div>
                <div
                  className={cn(
                    'max-h-[220px] overflow-auto rounded-lg',
                    contactSearchInput.trim().length > 0 && 'border border-border'
                  )}
                >
                  {contactSearchInput.trim().length > 0 && contactResults.isLoading && (
                    <div className="p-4 text-sm text-muted-foreground">Searching {entity.plural}…</div>
                  )}
                  {contactSearchInput.trim().length > 0 && !contactResults.isLoading && shownContactResults.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground">No {entity.plural} found.</div>
                  )}
                  {shownContactResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedContacts((prev) => (prev.some((sc) => sc.id === c.id) ? prev : [...prev, c]));
                        setContactSearchInput('');
                        setContactSearch('');
                      }}
                      className="flex w-full items-center gap-3 border-b border-border px-3.5 py-2.5 text-left last:border-b-0 hover:bg-secondary/60"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{c.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{c.phone}</div>
                      </div>
                      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                  {hiddenContactResultCount > 0 && (
                    <div className="border-t border-border p-2.5 text-center text-xs text-muted-foreground">
                      +{hiddenContactResultCount} more — keep typing to narrow it down
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 border-t border-border pt-3">
                  <Label className="text-xs text-muted-foreground">Or add a number manually</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="024 xxx xxxx"
                      inputMode="numeric"
                      className="sm:flex-1"
                      value={manualAddPhone}
                      onChange={(e) => setManualAddPhone(formatPhoneInput(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addManualRecipient();
                        }
                      }}
                    />
                    <Input
                      placeholder="Name (optional)"
                      className="sm:flex-1"
                      value={manualAddName}
                      onChange={(e) => setManualAddName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addManualRecipient();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant={manualAddPhoneValid ? 'default' : 'outline'}
                      size="lg"
                      className="shrink-0"
                      disabled={!manualAddPhoneValid}
                      onClick={addManualRecipient}
                    >
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4.5 rounded-xl border border-border bg-card p-5">
            <div className="mb-3.5 text-[15px] font-medium text-foreground/80">Sender ID</div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={senderSelectValue}
                  onValueChange={setSelectedSenderId}
                  items={[
                    ...(approvedSenderId ? [] : [{ value: '', label: 'Use system default sender ID' }]),
                    ...senderIds.map((s) => ({ value: s.id, label: s.senderId })),
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Use default sender ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {!approvedSenderId && (
                      <SelectItem className={'cursor-pointer'} value="">Use system default sender ID</SelectItem>
                    )}
                    {senderIds.map((s) => (
                      <SelectItem className={'cursor-pointer'} key={s.id} value={s.id} disabled={s.status !== 'approved'}>
                        <span className="flex-1 truncate">{s.senderId}</span>
                        <Badge variant={senderIdStatusVariant[s.status]}>{senderIdStatusLabel[s.status]}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="lg" onClick={() => setShowAddSenderId(true)} className="shrink-0 text-sm">
                <Plus className="h-4 w-4" /> Sender ID
              </Button>
            </div>
            {!approvedSenderId && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-border/50 bg-background p-3 text-xs">
                <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="text-muted-foreground">
                  {senderIds.length === 0 ? (
                    <>No sender ID registered — messages will be sent from the platform sender ID instead.</>
                  ) : (
                    <>No approved sender ID yet — messages will be sent from the platform sender ID until one is approved.</>
                  )}{' '}
                  A unique sender ID shows recipients your organization's name instead of a shared one, and reads as more trustworthy.
                </div>
              </div>
            )}
          </div>

          <div className="mb-4.5 rounded-xl border border-border bg-card p-5">
            <div className="mb-2.5 text-[15px] font-medium text-foreground/80">Template</div>
            <select
              className="w-full rounded-[9px] border border-border bg-background px-3.5 py-2.5 text-sm"
              value={templateId}
              onChange={(e) => {
                const id = e.target.value;
                setTemplateId(id);
                const tpl = templates.data?.find((t) => t.id === id);
                if (tpl) setBody(tpl.body);
              }}
            >
              <option value="">— Start from scratch —</option>
              {templates.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5 rounded-xl border border-border bg-card p-5">
            <div className="mb-2.5 text-[15px] font-medium text-foreground/80">Message</div>
            <Textarea
              ref={messageRef}
              placeholder="Type your message… or use the buttons below to personalize"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[140px] resize-y border-none p-0 shadow-none focus-visible:ring-0"
            />
            <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border pt-2.5">
              {MESSAGE_VARIABLES.map((v) => (
                <button
                  key={v.token}
                  type="button"
                  onClick={() => insertVariable(v.token)}
                  className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="h-3 w-3" /> {v.label}
                </button>
              ))}
            </div>
            <div className="mt-2.5 text-sm text-muted-foreground">
              {body.length}/160 characters — {segments} SMS segment(s)
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-[340px]">
          <div className="mb-4 rounded-2xl bg-foreground dark:bg-foreground/10 p-5.5">
            <div className="mb-3.5 text-xs font-bold uppercase tracking-wide text-white/50">Preview</div>
            <div className="overflow-hidden rounded-xl bg-secondary">
              <div className="bg-primary px-3.5 py-2.5 text-[13px] font-bold text-white">{effectiveSenderIdForSend}</div>
              <div className="min-h-[60px] break-words p-3.5 text-sm leading-relaxed text-foreground">
                {body || 'Your message preview will appear here.'}
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-2xl border border-border bg-card p-5">
            <div className="mb-2.5 flex justify-between text-sm">
              <div className="text-muted-foreground">Recipients</div>
              <div className="font-bold">{recipientCount}</div>
            </div>
            <div className="mb-2.5 flex justify-between text-sm">
              <div className="text-muted-foreground">SMS segments</div>
              <div className="font-bold">{segments}</div>
            </div>
            <div className="flex justify-between border-t border-border pt-2.5 text-sm">
              <div className="text-muted-foreground">{scheduleMode === 'recurring' ? 'Cost per run' : 'Estimated cost'}</div>
              <div className="font-bold text-primary">{estimatedCost} credits</div>
            </div>

            <div className="mt-3.5 space-y-2 border-t border-border pt-3.5">
              {checks.map((check) => (
                <div key={check.key} className="flex items-start gap-2 text-xs">
                  {check.status === 'ok' ? (
                    <Check className="mt-px h-3.5 w-3.5 shrink-0 text-success" />
                  ) : check.status === 'warning' ? (
                    <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-warning" />
                  ) : (
                    <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-destructive" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span
                      className={cn(
                        check.status === 'ok' && 'text-muted-foreground',
                        check.status === 'warning' && 'font-medium text-warning',
                        check.status === 'blocked' && 'font-medium text-destructive'
                      )}
                    >
                      {check.message}
                    </span>
                    {check.actionLabel && check.onAction && (
                      <button
                        type="button"
                        onClick={check.onAction}
                        className="ml-1.5 font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        {check.actionLabel} →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleOpenConfirm} disabled={isPending || !canSend}>
            {isPending ? 'Working…' : canSend ? actionLabel : blockers[0].buttonLabel ?? actionLabel}
          </Button>
        </div>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm &amp; {scheduleMode === 'now' ? 'send' : scheduleMode === 'once' ? 'schedule' : 'start recurring send'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              Recipients:{' '}
              <b className="text-foreground">{`${recipientCount} ${recipientCount === 1 ? entity.singular : entity.plural}`}</b>
            </div>
            <div>
              Credit cost: <b className="text-foreground">{estimatedCost} credits</b>
            </div>
            <div>
              Sending from: <b className="text-foreground">{effectiveSenderIdForSend}</b>
            </div>
            {scheduleMode === 'once' && (
              <div>
                When: <b className="text-foreground">{scheduleDate && scheduleTime ? new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString() : '—'}</b>
              </div>
            )}
            {scheduleMode === 'recurring' && (
              <div>
                Repeats: <b className="text-foreground">{recurringSummary}</b>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleConfirm}>
              {isPending ? 'Working…' : actionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddSenderIdDialog open={showAddSenderId} onOpenChange={setShowAddSenderId} />
    </div>
  );
}

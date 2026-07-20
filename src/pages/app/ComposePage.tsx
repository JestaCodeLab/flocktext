import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Send, CalendarClock, Repeat, Plus, Check, Info } from 'lucide-react';
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
import { fetchGroups, fetchContactsCount } from '@/api/contacts';
import { fetchTemplates } from '@/api/templates';
import { sendMessage, scheduleMessage, type RecurringFreq } from '@/api/messages';
import { fetchEffectiveSenderId } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { senderIdStatusLabel, senderIdStatusVariant } from '@/lib/senderIdStatus';
import { Badge } from '@/components/ui/badge';
import { formatPhoneInput } from '@/lib/phone';
import { cn } from '@/lib/utils';
import { useEntityLabels } from '@/lib/terminology';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

  const [recipientMode, setRecipientMode] = useState<'single' | 'groups' | 'all'>(preset?.recipientMode ?? 'groups');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [singlePhone, setSinglePhone] = useState(preset?.phone ?? '');
  const [singleName, setSingleName] = useState(preset?.recipientName ?? '');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'once' | 'recurring'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [recurringFreq, setRecurringFreq] = useState<RecurringFreq>('daily');
  const [recurringTime, setRecurringTime] = useState('09:00');
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState(1);
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState(1);

  const [templateId, setTemplateId] = useState(preset?.templateId ?? '');
  const [body, setBody] = useState(preset?.body ?? '');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAddSenderId, setShowAddSenderId] = useState(false);
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);

  const groups = useQuery({ queryKey: ['groups'], queryFn: fetchGroups });
  const templates = useQuery({ queryKey: ['templates'], queryFn: fetchTemplates });
  const contactsCount = useQuery({ queryKey: ['contacts-count'], queryFn: fetchContactsCount });
  const senderIds = session?.organization.senderIds ?? [];
  const approvedSenderIds = senderIds.filter((s) => s.status === 'approved');
  const approvedSenderId = approvedSenderIds.find((s) => s.isPrimary) ?? approvedSenderIds[0];

  const effectiveSenderId = useQuery({
    queryKey: ['effective-sender-id'],
    queryFn: fetchEffectiveSenderId,
    enabled: !approvedSenderId,
  });
  const effectiveSenderName = approvedSenderId?.senderId || effectiveSenderId.data?.senderId;

  const recipientCount = useMemo(() => {
    if (recipientMode === 'single') return singlePhone.trim() ? 1 : 0;
    if (recipientMode === 'all') return contactsCount.data ?? 0;
    return groups.data?.find((g) => g.id === selectedGroupId)?.count ?? 0;
  }, [recipientMode, singlePhone, groups.data, selectedGroupId, contactsCount.data]);

  const segments = countSegments(body);
  const estimatedCost = segments * recipientCount;

  const recurringSummary = useMemo(() => {
    if (recurringFreq === 'daily') return `Daily at ${recurringTime}`;
    if (recurringFreq === 'weekly') return `Weekly on ${WEEKDAYS[recurringDayOfWeek]} at ${recurringTime}`;
    return `Monthly on the ${ordinal(recurringDayOfMonth)} at ${recurringTime}`;
  }, [recurringFreq, recurringTime, recurringDayOfWeek, recurringDayOfMonth]);

  function resetForm() {
    setBody('');
    setTemplateId('');
    setSelectedGroupId(null);
    setSinglePhone('');
    setSingleName('');
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
      navigate('/app/reports', { state: { messageId: data.id } });
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

  function handleOpenConfirm() {
    if (!body.trim()) {
      toast.error('Write a message first.');
      return;
    }
    if (recipientMode === 'groups' && !selectedGroupId) {
      toast.error('Choose a group to send to.');
      return;
    }
    if (recipientMode === 'single' && !singlePhone.trim()) {
      toast.error('Enter a phone number to send to.');
      return;
    }
    if (scheduleMode === 'once') {
      if (!scheduleDate || !scheduleTime) {
        toast.error('Choose a date and time to send.');
        return;
      }
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      if (scheduledDateTime <= new Date()) {
        toast.error('Choose a future date and time.');
        return;
      }
    }
    setShowConfirm(true);
  }

  function handleConfirm() {
    const basePayload = {
      body,
      recipientType: recipientMode,
      groupIds: recipientMode === 'groups' && selectedGroupId ? [selectedGroupId] : undefined,
      phone: recipientMode === 'single' ? singlePhone : undefined,
      recipientName: recipientMode === 'single' ? singleName || undefined : undefined,
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

  const selectedSenderIdObj = senderIds.find((s) => s.id === selectedSenderId);
  const effectiveSenderIdForSend = selectedSenderIdObj?.senderId || effectiveSenderName;

  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-[26px] font-bold">Send SMS</div>
        <div className="text-sm text-muted-foreground">Compose and deliver messages to your {entity.plural}.</div>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setScheduleMode('now')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors',
            scheduleMode === 'now' ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Send className="h-4 w-4" /> Send Now
        </button>
        <button
          type="button"
          onClick={() => setScheduleMode('once')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors',
            scheduleMode === 'once' ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <CalendarClock className="h-4 w-4" /> Schedule
        </button>
        <button
          type="button"
          onClick={() => setScheduleMode('recurring')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors',
            scheduleMode === 'recurring' ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Repeat className="h-4 w-4" /> Recurring
        </button>
      </div>

      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-4.5 rounded-xl border border-border bg-card p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="text-[13px] font-bold text-foreground/80">Send To</div>
              <div className="flex rounded-lg border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setRecipientMode('groups')}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                    recipientMode === 'groups' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Groups
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('single')}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                    recipientMode === 'single' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('all')}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
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
                        <div className="truncate text-[13px] font-semibold leading-tight">{g.name}</div>
                        <div className="text-[11px] text-muted-foreground">{g.count} {entity.plural}</div>
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
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="single-phone">Phone number</Label>
                  <Input
                    id="single-phone"
                    placeholder="024 xxx xxxx"
                    inputMode="numeric"
                    value={singlePhone}
                    onChange={(e) => setSinglePhone(formatPhoneInput(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="single-name">Name (optional)</Label>
                  <Input
                    id="single-name"
                    placeholder="Used for {firstName}/{lastName} personalization"
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mb-4.5 rounded-xl border border-border bg-card p-5">
            <div className="mb-3.5 text-[13px] font-bold text-foreground/80">Sender ID</div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={selectedSenderId || ''} onValueChange={setSelectedSenderId}>
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Use default sender ID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className={'cursor-pointer'} value="">Use system default sender ID</SelectItem>
                    {senderIds.map((s) => (
                      <SelectItem className={'cursor-pointer'} key={s.id} value={s.id} disabled={s.status !== 'approved'}>
                        <span className="flex-1 truncate">{s.senderId}</span>
                        <Badge variant={senderIdStatusVariant[s.status]}>{senderIdStatusLabel[s.status]}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddSenderId(true)} className="shrink-0">
                <Plus className="h-4 w-4" /> New
              </Button>
            </div>
            {senderIds.length === 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-border/50 bg-background p-3 text-xs">
                <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="text-muted-foreground">
                  No sender IDs registered. Messages will be sent from the platform sender ID.
                </div>
              </div>
            )}
          </div>

          {(scheduleMode === 'once' || scheduleMode === 'recurring') && (
            <div className="mb-4.5 rounded-xl border border-border bg-card p-5">
              <div className="mb-3.5 text-[13px] font-bold text-foreground/80">Schedule details</div>
              {scheduleMode === 'once' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <DatePicker value={scheduleDate} onChange={setScheduleDate} placeholder="Select date" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Time</Label>
                    <TimePicker value={scheduleTime} onChange={setScheduleTime} placeholder="Select time" />
                  </div>
                </div>
              )}

            {scheduleMode === 'recurring' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
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
            <div className="mb-2.5 text-[13px] font-bold text-foreground/80">Template</div>
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
            <div className="mb-2.5 text-[13px] font-bold text-foreground/80">Message</div>
            <Textarea
              placeholder="Type your message… use {firstName}, {lastName} or {churchName} to personalize"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[140px] resize-y border-none p-0 shadow-none focus-visible:ring-0"
            />
            <div className="mt-2 border-t border-border pt-2.5 text-xs text-muted-foreground">
              {body.length}/160 characters — {segments} SMS segment(s) · <b className="font-semibold text-foreground/80">{'{firstName}'}</b>,{' '}
              <b className="font-semibold text-foreground/80">{'{lastName}'}</b> and <b className="font-semibold text-foreground/80">{'{churchName}'}</b>{' '}
              personalize per recipient.
            </div>
          </div>
        </div>

        <div className="w-[340px] shrink-0">
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
              <div className="font-bold">{recipientMode === 'single' ? (singlePhone ? 1 : 0) : recipientCount}</div>
            </div>
            <div className="mb-2.5 flex justify-between text-sm">
              <div className="text-muted-foreground">SMS segments</div>
              <div className="font-bold">{segments}</div>
            </div>
            <div className="flex justify-between border-t border-border pt-2.5 text-sm">
              <div className="text-muted-foreground">Estimated cost</div>
              <div className="font-bold text-primary">{estimatedCost} credits</div>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleOpenConfirm} disabled={isPending}>
            {actionLabel}
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
              <b className="text-foreground">{recipientMode === 'single' ? singlePhone || '—' : `${recipientCount} ${entity.plural}`}</b>
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

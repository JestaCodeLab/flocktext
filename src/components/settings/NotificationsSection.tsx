import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { LowBalanceThresholdDialog } from '@/components/organization/LowBalanceThresholdDialog';
import { updateNotifPrefs } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { SettingsCard } from './SettingsCard';

export function NotificationsSection() {
  const organization = useAuthStore((s) => s.session?.organization);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const prefs = organization?.notifPrefs ?? { lowBalance: true, lowBalanceThreshold: 50, scheduleConfirm: true, deliverySummary: false };
  const [showThreshold, setShowThreshold] = useState(false);

  const save = useMutation({
    mutationFn: updateNotifPrefs,
    onSuccess: (data) => updateOrganization(data),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  type ToggleKey = 'lowBalance' | 'scheduleConfirm' | 'deliverySummary';

  function toggle(key: ToggleKey) {
    save.mutate({ ...prefs, [key]: !prefs[key] });
  }

  const rows: { key: ToggleKey; label: string; description: string }[] = [
    {
      key: 'lowBalance',
      label: 'Low balance alerts',
      description: `Get notified when your SMS credit balance drops below ${prefs.lowBalanceThreshold.toLocaleString()} credits.`,
    },
    { key: 'scheduleConfirm', label: 'Schedule confirmations', description: 'Get notified when a scheduled or recurring send is confirmed.' },
    { key: 'deliverySummary', label: 'Delivery summaries', description: 'Get a summary after each send completes.' },
  ];

  return (
    <>
      <SettingsCard icon={Bell} title="Notifications" description="Choose what FlockText should keep you posted on." tint="teal">
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div>
                <div className="text-sm font-semibold">{row.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{row.description}</div>
              </div>
              <div className="flex items-center gap-3">
                {row.key === 'lowBalance' && (
                  <Button variant="outline" size="sm" onClick={() => setShowThreshold(true)}>
                    Set limit
                  </Button>
                )}
                <Switch checked={prefs[row.key]} onCheckedChange={() => toggle(row.key)} disabled={save.isPending} />
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      <LowBalanceThresholdDialog open={showThreshold} onOpenChange={setShowThreshold} prefs={prefs} />
    </>
  );
}

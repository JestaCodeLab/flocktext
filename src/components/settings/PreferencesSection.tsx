import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sun, Moon, Monitor, PaintBucket, Church, Briefcase, Landmark } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { updateOrganizationProfile } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { cn } from '@/lib/utils';
import { type OrganizationType } from '@/lib/terminology';
import { SettingsCard } from './SettingsCard';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: LucideIcon }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Monitor },
];

const CATEGORY_OPTIONS: { value: OrganizationType; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'church', label: 'Church', description: 'Contacts are called members', icon: Church },
  { value: 'business', label: 'Business', description: 'Contacts are called customers', icon: Briefcase },
  { value: 'institution', label: 'Institution', description: 'Contacts are called contacts', icon: Landmark },
];

export function PreferencesSection() {
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const organization = useAuthStore((s) => s.session?.organization);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);

  const saveCategory = useMutation({
    mutationFn: (organizationType: OrganizationType) =>
      updateOrganizationProfile({
        churchName: organization?.churchName ?? '',
        address: organization?.address ?? '',
        contactEmail: organization?.contactEmail,
        organizationType,
      }),
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Organization category updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <SettingsCard
        icon={PaintBucket}
        title="Appearance"
        description="Choose how FlockText looks on this device."
        tint="violet"
        className="lg:flex-1"
      >
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.mode}
              type="button"
              onClick={() => setThemeMode(option.mode)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                themeMode === option.mode
                  ? 'border-primary bg-accent/40 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <option.icon className="h-4 w-4" />
              {option.label}
            </button>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Landmark}
        title="Organization category"
        description="Configure how FlockText refers to your contacts and members."
        tint="gold"
        className="lg:flex-1"
      >
        <div className="grid grid-cols-3 gap-2.5">
          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={saveCategory.isPending}
              onClick={() => saveCategory.mutate(option.value)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3.5 text-center transition-colors',
                organization?.organizationType === option.value
                  ? 'border-primary bg-accent/40 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <option.icon className="h-5 w-5" />
              <span className="text-sm font-semibold">{option.label}</span>
              {/* <span className="text-xs leading-snug">{option.description}</span> */}
            </button>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
}

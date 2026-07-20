import { useLocation } from 'react-router-dom';
import { Building2, BadgeCheck, Bell, Users, ShieldCheck, PaintBucket, KeyRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AccountSection } from '@/components/settings/AccountSection';
import { PreferencesSection } from '@/components/settings/PreferencesSection';
import { SenderIdsSection } from '@/components/settings/SenderIdsSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { TeamSection } from '@/components/settings/TeamSection';
import { DeveloperSection } from '@/components/settings/DeveloperSection';
import { SecuritySection } from '@/components/settings/SecuritySection';

type SectionKey = 'account' | 'preferences' | 'sender-ids' | 'notifications' | 'team' | 'developer' | 'security';

const SECTIONS: { key: SectionKey; label: string; icon: LucideIcon }[] = [
  { key: 'account', label: 'Account', icon: Building2 },
  { key: 'preferences', label: 'Preferences', icon: PaintBucket },
  { key: 'sender-ids', label: 'Sender IDs', icon: BadgeCheck },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'developer', label: 'Developer', icon: KeyRound },
  { key: 'security', label: 'Security', icon: ShieldCheck },
];

const SECTION_CONTENT: Record<SectionKey, React.ComponentType> = {
  account: AccountSection,
  preferences: PreferencesSection,
  'sender-ids': SenderIdsSection,
  notifications: NotificationsSection,
  team: TeamSection,
  developer: DeveloperSection,
  security: SecuritySection,
};

const TRIGGER_CLASS = 'rounded-none border-b-2 border-transparent data-active:border-b-primary data-active:text-primary data-active:font-bold';

export function SettingsPage() {
  const location = useLocation();
  const initialTab: SectionKey = (location.state as { tab?: SectionKey } | null)?.tab ?? 'account';

  return (
    <div>
      <div className="mb-4">
        <div className="mb-1 text-[26px] font-bold">Settings</div>
        <div className="text-sm text-muted-foreground">Manage your account settings and preferences</div>
      </div>

      <Tabs defaultValue={initialTab}>
        <div className="mb-7 overflow-x-auto border-b">
          <TabsList variant="line" className="group-data-[orientation=horizontal]/tabs:h-auto min-w-0 justify-start gap-6 p-0">
            {SECTIONS.map((section) => (
              <TabsTrigger key={section.key} value={section.key} className={cn('h-auto px-0 py-3', TRIGGER_CLASS)}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {SECTIONS.map((section) => {
          const Section = SECTION_CONTENT[section.key];
          return (
            <TabsContent key={section.key} value={section.key}>
              <Section />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

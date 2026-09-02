import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markNotificationRead, type FeatureAnnouncementMetadata } from '@/api/notifications';
import { FeatureAnnouncementModal } from '@/components/announcements/FeatureAnnouncementModal';

function isFeatureMetadata(metadata: unknown): metadata is FeatureAnnouncementMetadata {
  return !!metadata && typeof metadata === 'object' && (metadata as { kind?: string }).kind === 'feature';
}

// Mounted once in AppShell. Watches the same notifications feed the bell uses
// (shares its react-query cache/poll) for the oldest unread admin-authored
// 'feature' announcement, and surfaces it as a modal the first time it's seen -
// dismissing marks it read, same as opening it from the bell would.
export function PlatformFeatureAnnouncement() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications, refetchInterval: 30000 });
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const pending = useMemo(() => {
    const notifications = query.data?.notifications ?? [];
    return notifications
      .filter((n) => n.type === 'platform_announcement' && !n.read && !dismissedIds.has(n.id) && isFeatureMetadata(n.metadata))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [query.data, dismissedIds]);

  if (!pending || !isFeatureMetadata(pending.metadata)) return null;

  const metadata = pending.metadata;

  function dismiss() {
    if (!pending) return;
    setDismissedIds((prev) => new Set(prev).add(pending.id));
    markRead.mutate(pending.id);
  }

  return (
    <FeatureAnnouncementModal
      open
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
      title={pending.title}
      subtext={metadata.subtext}
      slides={metadata.media.map((m) => ({ kind: m.kind, url: m.url }))}
      links={[...metadata.links.map((l) => ({ label: l.label, href: l.url })), { label: 'Got it', onClick: dismiss }]}
    />
  );
}

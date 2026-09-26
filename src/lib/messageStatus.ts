// Single source of truth for how a MessageRecipient's delivery status is labeled,
// colored, and explained - shared by the per-recipient StatusBadge, the aggregate
// per-message status badges on the various delivery report list pages, the
// DeliveryBarChart, and StatusInfoButton's legend popover, so all four always agree
// with each other instead of drifting into slightly different wordings/colors.
export type MessageRecipientStatus = 'pending' | 'submitted' | 'delivered' | 'failed' | 'rejected';

export const STATUS_ORDER: MessageRecipientStatus[] = ['delivered', 'submitted', 'pending', 'rejected', 'failed'];

interface StatusMeta {
  label: string;
  description: string;
  // Solid color, used for chart bars/legend dots (as a Tailwind bg-* class).
  dotClassName: string;
  // The same color, as the `--color-*` CSS custom property name (index.css) - for
  // contexts that need an actual color value rather than a class, like recharts'
  // `fill` prop.
  chartColorVar: string;
  // Badge variant token from components/ui/badge.tsx - 'outline' means this status
  // instead carries its own tint via tintClassName (no baked-in variant fits it).
  badgeVariant: 'success' | 'destructive' | 'secondary' | 'outline';
  tintClassName?: string;
}

export const STATUS_META: Record<MessageRecipientStatus, StatusMeta> = {
  pending: {
    label: 'Pending',
    description: "Accepted by our SMS gateway, but the network hasn't confirmed receipt yet.",
    dotClassName: 'bg-muted-foreground',
    chartColorVar: 'muted-foreground',
    badgeVariant: 'secondary',
  },
  submitted: {
    label: 'Submitted',
    description: "Confirmed received by the mobile network and is being routed to the recipient's device.",
    dotClassName: 'bg-chart-3',
    chartColorVar: 'chart-3',
    badgeVariant: 'outline',
    tintClassName: 'border-chart-3/30 bg-chart-3/10 text-chart-3',
  },
  delivered: {
    label: 'Delivered',
    description: "Successfully reached the recipient's device.",
    dotClassName: 'bg-success',
    chartColorVar: 'success',
    badgeVariant: 'success',
  },
  rejected: {
    label: 'Rejected',
    description: 'Blocked by the network operator before it could be sent (e.g. disallowed content or an invalid sender ID/number).',
    dotClassName: 'bg-warning',
    chartColorVar: 'warning',
    badgeVariant: 'outline',
    tintClassName: 'border-warning/30 bg-warning/10 text-warning',
  },
  failed: {
    label: 'Failed',
    description: "Not delivered - the recipient's number was invalid or unreachable, or the delivery window expired first.",
    dotClassName: 'bg-destructive',
    chartColorVar: 'destructive',
    badgeVariant: 'destructive',
  },
};

import { useQuery } from '@tanstack/react-query';
import { Building2, CheckCircle2, XCircle, Send, Wallet, BadgeCheck } from 'lucide-react';
import { fetchAdminDashboardSummary } from '@/api/adminDashboard';
import { StatCard } from '@/components/admin/StatCard';

export function AdminDashboardPage() {
  const summary = useQuery({ queryKey: ['admin-dashboard-summary'], queryFn: fetchAdminDashboardSummary });
  const d = summary.data;

  return (
    <div>
      <div className="mb-6 text-[26px] font-extrabold">Platform overview</div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={Building2} label="Total organizations" value={d?.totalOrganizations ?? 0} />
        <StatCard icon={CheckCircle2} label="Active organizations" value={d?.activeOrganizations ?? 0} />
        <StatCard icon={XCircle} label="Suspended organizations" value={d?.suspendedOrganizations ?? 0} />
        <StatCard icon={Send} label="Messages sent this month" value={d?.sentThisMonth ?? 0} />
        <StatCard icon={Wallet} label="Outstanding wallet credits" value={d?.totalWalletCredits ?? 0} />
        <StatCard icon={BadgeCheck} label="Sender IDs awaiting review" value={d?.pendingSenderIdCount ?? 0} />
      </div>
    </div>
  );
}

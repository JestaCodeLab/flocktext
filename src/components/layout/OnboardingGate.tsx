import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function OnboardingGate({ requireComplete }: { requireComplete: boolean }) {
  const organization = useAuthStore((s) => s.session?.organization);

  if (!organization) return null;

  const isComplete = Boolean(organization.onboardingCompletedAt);

  if (requireComplete && !isComplete) {
    return <Navigate to="/onboarding" replace />;
  }
  if (!requireComplete && isComplete) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}

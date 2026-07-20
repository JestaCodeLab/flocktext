import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const STEP_PATHS = ['welcome', 'organization', 'sender-id', 'contacts', 'wallet'];

export function OnboardingLayout() {
  const organization = useAuthStore((s) => s.session?.organization);
  const location = useLocation();

  if (!organization) return null;

  if (location.pathname === '/onboarding' || location.pathname === '/onboarding/') {
    const target = STEP_PATHS[Math.min(organization.onboardingStep, STEP_PATHS.length) - 1] || 'welcome';
    return <Navigate to={`/onboarding/${target}`} replace />;
  }

  const currentIndex = STEP_PATHS.indexOf(location.pathname.split('/').pop() || '');

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-[560px] rounded-[28px] border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="mb-8">
          <img src="/logo/flocktext-logo.png" alt="FlockText" className="h-9 w-auto dark:hidden" />
          <img src="/logo/flocktext-logo-white.png" alt="FlockText" className="hidden h-9 w-auto dark:block" />
        </div>

        <div className="mb-8 flex gap-1.5">
          {STEP_PATHS.map((step, i) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentIndex ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>

        <Outlet />
      </div>
    </div>
  );
}

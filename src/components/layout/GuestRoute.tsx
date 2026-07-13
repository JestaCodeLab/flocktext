import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Inverse of ProtectedRoute: keeps an already-authenticated user off the
// signup/login/verify-otp/forgot-password pages (e.g. via browser back after
// completing signup) by bouncing them into the app instead. /app/dashboard is
// a safe universal target - OnboardingGate there redirects on to /onboarding
// if it isn't finished yet.
export function GuestRoute() {
  const session = useAuthStore((s) => s.session);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (session && accessToken) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}

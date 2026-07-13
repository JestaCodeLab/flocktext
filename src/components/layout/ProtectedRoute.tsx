import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function ProtectedRoute() {
  const session = useAuthStore((s) => s.session);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!session || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

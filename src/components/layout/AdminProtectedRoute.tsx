import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export function AdminProtectedRoute() {
  const session = useAdminAuthStore((s) => s.session);
  const accessToken = useAdminAuthStore((s) => s.accessToken);

  if (!session || !accessToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

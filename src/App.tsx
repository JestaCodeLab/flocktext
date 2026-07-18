import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { OtpPage } from '@/pages/auth/OtpPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { JoinPage } from '@/pages/public/JoinPage';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { GuestRoute } from '@/components/layout/GuestRoute';
import { OnboardingGate } from '@/components/layout/OnboardingGate';
import { AdminProtectedRoute } from '@/components/layout/AdminProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminOrganizationsPage } from '@/pages/admin/AdminOrganizationsPage';
import { AdminOrganizationDetailPage } from '@/pages/admin/AdminOrganizationDetailPage';
import { AdminPackagesPage } from '@/pages/admin/AdminPackagesPage';
import { AdminSenderIdsPage } from '@/pages/admin/AdminSenderIdsPage';
import { AdminAddonsPage } from '@/pages/admin/AdminAddonsPage';
import { OnboardingLayout } from '@/pages/onboarding/OnboardingLayout';
import { WelcomeStep } from '@/pages/onboarding/WelcomeStep';
import { OrganizationStep } from '@/pages/onboarding/OrganizationStep';
import { SenderIdStep } from '@/pages/onboarding/SenderIdStep';
import { ContactsStep } from '@/pages/onboarding/ContactsStep';
import { WalletStep } from '@/pages/onboarding/WalletStep';
import { DashboardPage } from '@/pages/app/DashboardPage';
import { ContactsPage } from '@/pages/app/ContactsPage';
import { GroupsPage } from '@/pages/app/GroupsPage';
import { GroupDetailPage } from '@/pages/app/GroupDetailPage';
import { BirthdaysPage } from '@/pages/app/BirthdaysPage';
import { ComposePage } from '@/pages/app/ComposePage';
import { TemplatesPage } from '@/pages/app/TemplatesPage';
import { WalletPage } from '@/pages/app/WalletPage';
import { ReportsPage } from '@/pages/app/ReportsPage';
import { SettingsPage } from '@/pages/app/SettingsPage';
import { ActivityLogPage } from '@/pages/app/ActivityLogPage';

function App() {
  const location = useLocation();
  const themeResolved = useThemeStore((s) => s.resolved);

  useEffect(() => {
    const inThemedScope = location.pathname.startsWith('/app') || location.pathname.startsWith('/onboarding');
    document.documentElement.classList.toggle('dark', inThemedScope && themeResolved === 'dark');
  }, [location.pathname, themeResolved]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<OtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route path="/join/:token" element={<JoinPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="organizations" element={<AdminOrganizationsPage />} />
          <Route path="organizations/:id" element={<AdminOrganizationDetailPage />} />
          <Route path="packages" element={<AdminPackagesPage />} />
          <Route path="sender-ids" element={<AdminSenderIdsPage />} />
          <Route path="addons" element={<AdminAddonsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<OnboardingGate requireComplete={false} />}>
          <Route path="/onboarding" element={<OnboardingLayout />}>
            <Route path="welcome" element={<WelcomeStep />} />
            <Route path="organization" element={<OrganizationStep />} />
            <Route path="sender-id" element={<SenderIdStep />} />
            <Route path="contacts" element={<ContactsStep />} />
            <Route path="wallet" element={<WalletStep />} />
          </Route>
        </Route>

        <Route element={<OnboardingGate requireComplete={true} />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="contacts/groups" element={<GroupsPage />} />
            <Route path="contacts/groups/:id" element={<GroupDetailPage />} />
            <Route path="contacts/birthdays" element={<BirthdaysPage />} />
            <Route path="compose" element={<ComposePage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="scheduled" element={<Navigate to="/app/reports" replace />} />
            <Route path="sender-id" element={<Navigate to="/app/settings" replace />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="activity-log" element={<ActivityLogPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;

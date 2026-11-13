// ==============================================================================
// KAPLA Staff Dashboard — Root Application & Authentication State Machine
// ==============================================================================

import React from 'react';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { VerifyEmailScreen } from './components/auth/VerifyEmailScreen';
import { PendingApprovalScreen } from './components/auth/PendingApprovalScreen';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { DisabledAccountScreen } from './components/auth/DisabledAccountScreen';
import { AppLayout } from './components/dashboard/AppLayout';
import { Loader2 } from 'lucide-react';

export function AppContent() {
  const { user, profile, authScreen, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#012147] flex flex-col items-center justify-center p-4 text-white">
        <img
          src="/assets/kapla-logo-color.png"
          alt="KAPLA Logo"
          className="h-12 w-auto object-contain mb-4 animate-pulse drop-shadow-xl"
        />
        <div className="flex items-center gap-2 text-sky-200 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
          <span>Đang kết nối hệ thống phân quyền KAPLA...</span>
        </div>
      </div>
    );
  }

  // 1. If not logged in, render requested Auth screen
  if (!user) {
    switch (authScreen) {
      case 'register':
        return <RegisterForm />;
      case 'verify-email':
        return <VerifyEmailScreen />;
      case 'pending-approval':
        return <PendingApprovalScreen />;
      case 'forgot-password':
        return <ForgotPasswordForm />;
      case 'reset-password':
        return <ResetPasswordForm />;
      case 'disabled':
        return <DisabledAccountScreen />;
      case 'login':
      default:
        return <LoginForm />;
    }
  }

  // 2. User is signed in — Check Email Verification state
  if (!user.emailConfirmed) {
    return <VerifyEmailScreen />;
  }

  // 3. User is signed in and email confirmed — Check Approval Status
  if (!profile || profile.status === 'pending') {
    return <PendingApprovalScreen />;
  }

  // 4. User is signed in but disabled
  if (profile.status === 'inactive') {
    return <DisabledAccountScreen />;
  }

  // 5. User is active and authorized — Render Main Dashboard
  return <AppLayout />;
}

export default function App() {
  return <AppContent />;
}

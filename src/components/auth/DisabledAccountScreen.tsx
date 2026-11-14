// ==============================================================================
// KAPLA Staff Dashboard — Disabled Account Screen
// ==============================================================================

import React from 'react';
import { ShieldAlert, LogOut, PhoneCall } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';

export const DisabledAccountScreen: React.FC = () => {
  const { profile, signOut } = useAuth();

  return (
    <AuthLayout
      title="Account Suspended"
      subtitle="Access for this account has been disabled by System Administration."
    >
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-base font-bold text-slate-900">
            Account Disabled / Suspended
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            The profile associated with email <span className="font-mono font-medium text-slate-800">{profile?.email}</span> no longer has access to academic data.
          </p>

          {profile?.rejection_reason && (
            <div className="mt-3 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 text-left">
              <span className="font-semibold block text-slate-800 mb-0.5">Recorded Reason:</span>
              {profile.rejection_reason}
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-center gap-2">
          <PhoneCall className="w-4 h-4 text-slate-400" />
          <span>Please contact Human Resources or the Center Manager for assistance.</span>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </AuthLayout>
  );
};

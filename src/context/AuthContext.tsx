// ==============================================================================
// KAPLA Staff Dashboard — AuthContext & Permission Management
// ==============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AuthScreen,
  Branch,
  BranchMembership,
  StaffRole,
  UserProfile,
} from '../types';
import { isDevMockMode, MockStorageService, realSupabase } from '../lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  memberships: BranchMembership[];
  currentBranch: Branch | null;
  availableBranches: Branch[];
  activeRole: StaffRole | 'Quản trị hệ thống' | null;
  authScreen: AuthScreen;
  loading: boolean;
  error: string | null;
  isDevMock: boolean;
  // Auth methods
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    fullName: string,
    email: string,
    pass: string,
    phone?: string,
    preferredBranchId?: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  verifyEmailConfirm: (email?: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPass: string) => Promise<{ success: boolean; error?: string }>;
  setAuthScreen: (screen: AuthScreen) => void;
  switchBranch: (branchId: string) => void;
  refreshProfile: () => Promise<void>;
  // Quick switch for local demo & verification
  quickLoginAs: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<BranchMembership[]>([]);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load branches
  const loadBranches = useCallback(async () => {
    if (realSupabase) {
      const { data, error: err } = await realSupabase
        .from('branches')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (!err && data) {
        setAvailableBranches(data);
        return data;
      }
    }
    const mock = MockStorageService.getBranches();
    setAvailableBranches(mock);
    return mock;
  }, []);

  // Sync profile & memberships from user id
  const syncUserData = useCallback(async (uid: string, userEmail: string, emailConfirmed: boolean) => {
    setError(null);
    let userProfile: UserProfile | null = null;
    let userMemberships: BranchMembership[] = [];

    if (realSupabase) {
      // 1. Fetch Profile
      const { data: pData } = await realSupabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      userProfile = pData;

      // 2. Fetch Memberships
      const { data: mData } = await realSupabase
        .from('branch_memberships')
        .select('*, branch:branches(*)')
        .eq('user_id', uid)
        .eq('status', 'active');
      userMemberships = mData || [];
    } else {
      // Mock Storage Fallback
      const profiles = MockStorageService.getProfiles();
      userProfile = profiles.find((p) => p.id === uid || p.email.toLowerCase() === userEmail.toLowerCase()) || null;

      const allMemberships = MockStorageService.getMemberships();
      const allBranches = MockStorageService.getBranches();
      if (userProfile) {
        userMemberships = allMemberships
          .filter((m) => m.user_id === userProfile!.id && m.status === 'active')
          .map((m) => ({
            ...m,
            branch: allBranches.find((b) => b.id === m.branch_id),
          }));
      }
    }

    setProfile(userProfile);
    setMemberships(userMemberships);

    // Compute active branch with strict branch isolation:
    // Non-admin accounts ONLY have access to branches they actively belong to
    const branches = await loadBranches();
    if (userProfile?.system_role === 'system_admin') {
      // Admin has full system visibility across all branches
      setAvailableBranches(branches);
      const def = branches.find((b) => b.id === userProfile?.preferred_branch_id) || branches[0] || null;
      setCurrentBranch(def);
    } else if (userMemberships.length > 0) {
      // Non-admin staff: ONLY branches where user has active membership are available
      const authorizedBranches = branches.filter((b) =>
        userMemberships.some((m) => m.branch_id === b.id && m.status === 'active')
      );
      setAvailableBranches(authorizedBranches);
      const primary = userMemberships.find((m) => m.is_primary) || userMemberships[0];
      const b = authorizedBranches.find((br) => br.id === primary.branch_id) || authorizedBranches[0] || null;
      setCurrentBranch(b);
    } else {
      setAvailableBranches([]);
      setCurrentBranch(null);
    }

    // Determine target AuthScreen / View
    if (!emailConfirmed) {
      setAuthScreen('verify-email');
    } else if (!userProfile || userProfile.status === 'pending') {
      setAuthScreen('pending-approval');
    } else if (userProfile.status === 'inactive') {
      setAuthScreen('disabled');
    } else {
      // User is active and authorized
      setAuthScreen('login'); // When authenticated & active, parent will render Dashboard
    }
  }, [loadBranches]);

  // Initial session check
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      setLoading(true);
      await loadBranches();

      if (realSupabase) {
        const { data: { session } } = await realSupabase.auth.getSession();
        if (session?.user && mounted) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            emailConfirmed: Boolean(session.user.email_confirmed_at),
          };
          setUser(authUser);
          await syncUserData(authUser.id, authUser.email, authUser.emailConfirmed);
        } else {
          setUser(null);
          setProfile(null);
          setMemberships([]);
        }

        // Listen for auth changes
        const { data: { subscription } } = realSupabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mounted) return;
            if (newSession?.user) {
              const u: AuthUser = {
                id: newSession.user.id,
                email: newSession.user.email || '',
                emailConfirmed: Boolean(newSession.user.email_confirmed_at),
              };
              setUser(u);
              await syncUserData(u.id, u.email, u.emailConfirmed);
            } else {
              setUser(null);
              setProfile(null);
              setMemberships([]);
              setAuthScreen('login');
            }
          }
        );

        setLoading(false);
        return () => subscription.unsubscribe();
      } else {
        // Mock session check
        const stored = localStorage.getItem('kapla_mock_auth_user');
        if (stored) {
          try {
            const authUser: AuthUser = JSON.parse(stored);
            setUser(authUser);
            await syncUserData(authUser.id, authUser.email, authUser.emailConfirmed);
          } catch {
            localStorage.removeItem('kapla_mock_auth_user');
          }
        }
        setLoading(false);
      }
    };

    initAuth();
    return () => {
      mounted = false;
    };
  }, [loadBranches, syncUserData]);

  // Sign In
  const signIn = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      if (realSupabase) {
        const { data, error: sError } = await realSupabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (sError) throw sError;
        if (data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || '',
            emailConfirmed: Boolean(data.user.email_confirmed_at),
          };
          setUser(authUser);
          await syncUserData(authUser.id, authUser.email, authUser.emailConfirmed);
          return { success: true };
        }
      } else {
        // Mock Sign-in
        const profiles = MockStorageService.getProfiles();
        const found = profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
        if (!found) {
          throw new Error('Email hoặc mật khẩu không chính xác.');
        }

        const authUser: AuthUser = {
          id: found.id,
          email: found.email,
          emailConfirmed: true, // Default existing seeded accounts are email-confirmed
        };
        localStorage.setItem('kapla_mock_auth_user', JSON.stringify(authUser));
        setUser(authUser);
        await syncUserData(authUser.id, authUser.email, authUser.emailConfirmed);
        return { success: true };
      }
      return { success: false, error: 'Đăng nhập không thành công.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống khi đăng nhập.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Sign Up
  const signUp = async (
    fullName: string,
    email: string,
    pass: string,
    phone?: string,
    preferredBranchId?: string
  ) => {
    setError(null);
    setLoading(true);
    try {
      if (realSupabase) {
        const { data, error: sError } = await realSupabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone?.trim(),
              preferred_branch_id: preferredBranchId,
            },
          },
        });
        if (sError) throw sError;
        if (data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || '',
            emailConfirmed: Boolean(data.user.email_confirmed_at),
          };
          setUser(authUser);
          await syncUserData(authUser.id, authUser.email, authUser.emailConfirmed);
          setAuthScreen(authUser.emailConfirmed ? 'pending-approval' : 'verify-email');
          return { success: true };
        }
      } else {
        // Mock Sign-up
        const profiles = MockStorageService.getProfiles();
        if (profiles.some((p) => p.email.toLowerCase() === email.trim().toLowerCase())) {
          throw new Error('Email này đã được đăng ký trong hệ thống.');
        }

        const newId = 'u-' + Math.random().toString(36).substring(2, 10);
        const newProfile: UserProfile = {
          id: newId,
          email: email.trim(),
          full_name: fullName.trim(),
          phone: phone?.trim(),
          preferred_branch_id: preferredBranchId,
          system_role: 'staff',
          status: 'pending',
          created_at: new Date().toISOString(),
        };

        profiles.push(newProfile);
        MockStorageService.saveProfiles(profiles);

        // Record audit
        MockStorageService.appendAuditLog({
          actor_email: email.trim(),
          action: 'REGISTER_PENDING',
          target_user_email: email.trim(),
          branch_id: preferredBranchId,
          details: { full_name: fullName.trim(), phone },
        });

        const authUser: AuthUser = {
          id: newId,
          email: email.trim(),
          emailConfirmed: false, // New registration requires email verification first!
        };
        localStorage.setItem('kapla_mock_auth_user', JSON.stringify(authUser));
        setUser(authUser);
        await syncUserData(authUser.id, authUser.email, authUser.emailConfirmed);
        setAuthScreen('verify-email');
        return { success: true };
      }
      return { success: false, error: 'Đăng ký không thành công.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống khi đăng ký.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Email confirmation helper (simulate verify email click or confirm token)
  const verifyEmailConfirm = async (targetEmail?: string) => {
    setLoading(true);
    try {
      const activeEmail = targetEmail || user?.email;
      if (!activeEmail) throw new Error('Không xác định được địa chỉ email.');

      if (realSupabase) {
        // In real Supabase, user clicks email link with token.
        // We trigger refreshSession
        await realSupabase.auth.refreshSession();
        const { data: { user: updatedUser } } = await realSupabase.auth.getUser();
        if (updatedUser) {
          const u: AuthUser = {
            id: updatedUser.id,
            email: updatedUser.email || '',
            emailConfirmed: Boolean(updatedUser.email_confirmed_at),
          };
          setUser(u);
          await syncUserData(u.id, u.email, u.emailConfirmed);
        }
      } else {
        // Mock verification
        if (user) {
          const updated: AuthUser = {
            ...user,
            emailConfirmed: true,
          };
          localStorage.setItem('kapla_mock_auth_user', JSON.stringify(updated));
          setUser(updated);
          await syncUserData(updated.id, updated.email, true);
        }
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xác thực email thất bại.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    setLoading(true);
    try {
      if (realSupabase) {
        await realSupabase.auth.signOut();
      }
      localStorage.removeItem('kapla_mock_auth_user');
      setUser(null);
      setProfile(null);
      setMemberships([]);
      setCurrentBranch(null);
      setAuthScreen('login');
    } finally {
      setLoading(false);
    }
  };

  // Password reset request
  const requestPasswordReset = async (email: string) => {
    try {
      if (realSupabase) {
        const { error: err } = await realSupabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/#reset-password`,
        });
        if (err) throw err;
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi email đặt lại mật khẩu.';
      return { success: false, error: msg };
    }
  };

  // Password update
  const resetPassword = async (newPass: string) => {
    try {
      if (realSupabase) {
        const { error: err } = await realSupabase.auth.updateUser({ password: newPass });
        if (err) throw err;
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật mật khẩu thất bại.';
      return { success: false, error: msg };
    }
  };

  // Switch current branch (with strict RBAC enforcement)
  const switchBranch = (branchId: string) => {
    // If not system admin, reject any attempt to switch to an unauthorized branch
    if (profile?.system_role !== 'system_admin') {
      const isAuthorized = memberships.some((m) => m.branch_id === branchId && m.status === 'active');
      if (!isAuthorized) {
        console.warn(`[KAPLA RBAC SECURITY] User ${profile?.id} denied switching to unauthorized branch ${branchId}`);
        return;
      }
    }
    const found = availableBranches.find((b) => b.id === branchId);
    if (found) {
      setCurrentBranch(found);
    }
  };

  // Refresh profile & memberships
  const refreshProfile = async () => {
    if (user) {
      await syncUserData(user.id, user.email, user.emailConfirmed);
    }
  };

  // Quick Login helper for testing demo roles
  const quickLoginAs = async (email: string) => {
    await signIn(email, 'test-password');
  };

  // Determine active role label
  const activeRole: StaffRole | 'Quản trị hệ thống' | null =
    profile?.system_role === 'system_admin'
      ? 'Quản trị hệ thống'
      : currentBranch && memberships.find((m) => m.branch_id === currentBranch.id)?.role
      ? (memberships.find((m) => m.branch_id === currentBranch.id)!.role as StaffRole)
      : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        memberships,
        currentBranch,
        availableBranches,
        activeRole,
        authScreen,
        loading,
        error,
        isDevMock: isDevMockMode,
        signIn,
        signUp,
        signOut,
        verifyEmailConfirm,
        requestPasswordReset,
        resetPassword,
        setAuthScreen,
        switchBranch,
        refreshProfile,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

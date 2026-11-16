// ==============================================================================
// KAPLA Staff Dashboard — Registration OTP Verification Service
// Official Dispatcher: kapladashboard@gmail.com (Google SMTP)
// ==============================================================================

import { MockStorageService, EmailNotificationService } from './supabase';
import { buildKaplaEmailHtml } from './emailTemplate';

export interface PendingRegistration {
  fullName: string;
  email: string;
  phone?: string;
  preferredBranchId?: string;
  password: string;
  otp: string;
  expiresAt: number;
}

const OTP_STORAGE_KEY = 'kapla_pending_registration_otp';
let memoryPending: PendingRegistration | null = null;

export const RegistrationOtpService = {
  getPending(): PendingRegistration | null {
    if (memoryPending) return memoryPending;
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(OTP_STORAGE_KEY) || localStorage.getItem(OTP_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clearPending(): void {
    memoryPending = null;
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(OTP_STORAGE_KEY);
    localStorage.removeItem(OTP_STORAGE_KEY);
  },

  async generateAndSendOtp(payload: {
    fullName: string;
    email: string;
    phone?: string;
    preferredBranchId?: string;
    password: string;
  }): Promise<{ success: boolean; error?: string; otpPreview?: string }> {
    const cleanEmail = payload.email.trim().toLowerCase();

    // Check if email already registered
    const profiles = MockStorageService.getProfiles();
    if (profiles.some((p) => p.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'This email is already registered in the system. Please sign in instead.' };
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const pendingData: PendingRegistration = {
      fullName: payload.fullName.trim(),
      email: cleanEmail,
      phone: payload.phone?.trim(),
      preferredBranchId: payload.preferredBranchId,
      password: payload.password,
      otp,
      expiresAt,
    };

    memoryPending = pendingData;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(pendingData));
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(pendingData));
    }

    const emailHtml = buildKaplaEmailHtml({
      subject: 'KAPLA Educational Portal — Staff Account Verification OTP',
      title: 'Staff Account Registration Verification',
      userName: payload.fullName.trim(),
      actionType: 'otp',
      otpCode: otp,
      otpExpiresMinutes: 10,
      recipients: [cleanEmail],
      senderAddress: EmailNotificationService.getSenderEmail(),
      text: `Thank you for registering an internal staff account on the KAPLA Operations Portal.\n\nPlease use the one-time security passcode (OTP) below to authenticate and activate your staff account. Once verified, your registration profile will be forwarded to the Center Manager (CM) for campus onboarding and role authorization.`,
    });

    // Record in local outbox
    EmailNotificationService.dispatchAutomatedEmail({
      title: `Registration Verification OTP: ${payload.fullName.trim()} (${cleanEmail})`,
      actionType: 'test',
      recipients: [cleanEmail],
      content: `Registration OTP [${otp}] dispatched to verify new staff account creation for ${cleanEmail}. Valid for 10 minutes.`,
    });

    // Real Google SMTP dispatch via /api/send-email
    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: cleanEmail,
            subject: `[KAPLA Security] Your Staff Registration Verification Code: ${otp}`,
            title: `Registration OTP: ${cleanEmail}`,
            html: emailHtml,
            text: `Hello ${payload.fullName}, your KAPLA staff verification OTP code is: ${otp}. Valid for 10 minutes.`,
            actionType: 'test',
          }),
        });
      } catch (err) {
        console.warn('Network send-email error (falling back to in-app OTP preview):', err);
      }
    }

    return { success: true, otpPreview: otp };
  },

  verifyOtp(enteredOtp: string): { success: boolean; payload?: PendingRegistration; error?: string } {
    const pending = this.getPending();
    if (!pending) {
      return { success: false, error: 'No pending registration found. Please submit the registration form again.' };
    }

    if (Date.now() > pending.expiresAt) {
      this.clearPending();
      return { success: false, error: 'Verification code has expired (10-minute limit). Please request a new OTP.' };
    }

    const cleanInput = enteredOtp.replace(/\s+/g, '').trim();
    if (cleanInput !== pending.otp) {
      return { success: false, error: 'Incorrect 6-digit OTP code. Please check your inbox or spam folder.' };
    }

    return { success: true, payload: pending };
  },
};

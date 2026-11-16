// ==============================================================================
// KAPLA Staff Operations — Synchronized Branded Email Template Generator
// Enterprise Design System matching KAPLA Staff Portal & Official Brand Identity
// 
// Specifications:
// - 100% Bespoke Vector SVG Iconography (NO default OS emojis or unicode glyphs)
// - 100% English international academic terminology
// - High-contrast text & WCAG AAA accessible color palettes
// - Brand Palette: Deep Navy (#012147, #043264), Electric Blue (#026fd7), Pure White (#ffffff)
// - Official Logo: https://kapla.io.vn/assets/kapla-logo-color.png
// - Official Hotline: 028 7108 8899 (Official Web www.kapla.edu.vn)
// - Official Campus: Ground & Mezzanine Floor, Topaz Elite, Ward 4, District 8, HCMC
// ==============================================================================

export interface StaffApplicantInfo {
  fullName: string;
  email: string;
  phone?: string;
  preferredBranchName?: string;
  applicantId?: string;
  registeredAt?: string;
  status?: string;
}

export interface BuildEmailHtmlOptions {
  subject: string;
  title?: string;
  text?: string;
  content?: string;
  actionType?: 'reminder' | 'renewal' | 'feedback' | 'otp' | 'test' | 'onboarding' | string;
  recipients?: string[];
  metadata?: Record<string, any>;
  otpCode?: string;
  otpExpiresMinutes?: number;
  userName?: string;
  turnaround?: string;
  senderAddress?: string;
  applicantInfo?: StaffApplicantInfo;
  actionUrl?: string;
  actionButtonText?: string;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ------------------------------------------------------------------------------
// Bespoke Vector Icon Suite (Zero Default Emojis)
// ------------------------------------------------------------------------------
const CUSTOM_ICONS = {
  // Security / OTP Lock Badge Icon
  securityBadge: `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -2px; margin-right: 6px;">
      <rect x="3" y="10" width="18" height="12" rx="2.5" stroke="#ffffff" stroke-width="2.2" fill="rgba(255,255,255,0.2)"/>
      <path d="M7 10V6.5C7 3.73858 9.23858 1.5 12 1.5C14.7614 1.5 17 3.73858 17 6.5V10" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="12" cy="15.5" r="1.5" fill="#ffffff"/>
    </svg>
  `,

  // Care Reminder Calendar & Clock Badge Icon
  reminderBadge: `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -2px; margin-right: 6px;">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="#ffffff" stroke-width="2.2" fill="rgba(255,255,255,0.2)"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="3" y1="9.5" x2="21" y2="9.5" stroke="#ffffff" stroke-width="2"/>
      <path d="M12 13V16L14.5 17" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  // Tuition Expiry Payment Card Badge Icon
  renewalBadge: `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -2px; margin-right: 6px;">
      <rect x="2" y="5" width="20" height="14" rx="2.5" stroke="#ffffff" stroke-width="2.2" fill="rgba(255,255,255,0.2)"/>
      <line x1="2" y1="9.5" x2="22" y2="9.5" stroke="#ffffff" stroke-width="2"/>
      <rect x="5.5" y="13.5" width="4" height="2.5" rx="0.5" fill="#ffffff"/>
      <circle cx="17" cy="14.5" r="1.8" fill="#ffffff"/>
    </svg>
  `,

  // Parent Feedback Dialogue Badge Icon
  feedbackBadge: `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -2px; margin-right: 6px;">
      <path d="M21 14.5C21 15.0304 20.7893 15.5391 20.4142 15.9142C20.0391 16.2893 19.5304 16.5 19 16.5H7L3 20.5V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V14.5Z" stroke="#ffffff" stroke-width="2" fill="rgba(255,255,255,0.2)" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M7.5 8.5H16.5M7.5 12H13.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  // Staff Onboarding & Approval Badge Icon
  onboardingBadge: `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -2px; margin-right: 6px;">
      <path d="M16 21V19C16 16.7909 14.2091 15 12 15H6C3.79086 15 2 16.7909 2 19V21" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="9" cy="7" r="4" stroke="#ffffff" stroke-width="2.2" fill="rgba(255,255,255,0.2)"/>
      <line x1="19" y1="8" x2="19" y2="14" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="16" y1="11" x2="22" y2="11" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
    </svg>
  `,

  // System Operational Node Badge Icon
  systemBadge: `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -2px; margin-right: 6px;">
      <circle cx="12" cy="12" r="9" stroke="#ffffff" stroke-width="2.2" fill="rgba(255,255,255,0.2)"/>
      <path d="M6.5 12H9L11 7.5L13 16.5L15 12H17.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  // Verified Shield Check Icon (Audit Table)
  verifiedShield: `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -2px; margin-right: 5px;">
      <path d="M12 2L4 5.5V11C4 16.5 7.5 21.5 12 23C16.5 21.5 20 16.5 20 11V5.5L12 2Z" fill="#047857"/>
      <path d="M8.5 11.5L11 14L15.5 9" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  // Sender Airplane Icon
  senderIcon: `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -1px; margin-right: 5px;">
      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="#026fd7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  // Recipients Icon
  recipientIcon: `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -1px; margin-right: 5px;">
      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#026fd7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="9" cy="7" r="4" stroke="#026fd7" stroke-width="2.5"/>
    </svg>
  `,

  // Clock Icon
  clockIcon: `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -1px; margin-right: 5px;">
      <circle cx="12" cy="12" r="9" stroke="#026fd7" stroke-width="2.5"/>
      <path d="M12 7V12L15 14" stroke="#026fd7" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `,

  // Turnaround Stopwatch Icon
  slaIcon: `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -1px; margin-right: 5px;">
      <circle cx="12" cy="12" r="9" stroke="#047857" stroke-width="2.5"/>
      <path d="M12 6V12L16 12" stroke="#047857" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `,

  // Phone Handset Icon (Footer)
  phoneIcon: `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -1px; margin-right: 4px;">
      <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4741 21.8325 20.7294C21.7209 20.9846 21.5573 21.2137 21.3521 21.4019C21.1468 21.5901 20.9046 21.733 20.6407 21.8213C20.3769 21.9096 20.0974 21.9414 19.82 21.92C16.7428 21.5856 13.787 20.5342 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.19 12.85C3.49997 10.2412 2.44824 7.27099 2.12 4.18C2.09873 3.90347 2.13028 3.62486 2.21815 3.36172C2.30602 3.09859 2.44827 2.85679 2.63584 2.65203C2.82341 2.44727 3.05199 2.28414 3.30691 2.17297C3.56184 2.06179 3.83733 2.00508 4.11 2.02H7.11C7.5953 1.99522 8.06742 2.16708 8.42848 2.49987C8.78954 2.83266 9.01377 3.30252 9.06 3.82C9.14603 4.79373 9.3847 5.74828 9.77 6.66C9.91427 7.00004 9.94827 7.37446 9.86791 7.73373C9.78756 8.093 9.59627 8.42168 9.32 8.68L8.09 9.91C9.51355 12.4135 11.5865 14.4865 14.09 15.91L15.32 14.68C15.5783 14.4037 15.907 14.2124 16.2663 14.1321C16.6255 14.0517 17 14.0857 17.34 14.23C18.2517 14.6153 19.2063 14.854 20.18 14.94C20.7027 14.9866 21.1768 15.2144 21.5113 15.5804C21.8458 15.9464 22.0163 16.4253 21.99 16.92H22Z" stroke="#026fd7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  // Email Envelope Icon (Footer)
  envelopeIcon: `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -1px; margin-right: 4px;">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="#026fd7" stroke-width="2"/>
      <path d="M22 6L12 13L2 6" stroke="#026fd7" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  // Website Globe Icon (Footer)
  globeIcon: `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -1px; margin-right: 4px;">
      <circle cx="12" cy="12" r="10" stroke="#026fd7" stroke-width="2"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke="#026fd7" stroke-width="2"/>
      <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="#026fd7" stroke-width="2"/>
    </svg>
  `,

  // Campus Pin Icon (Footer)
  pinIcon: `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: -1px; margin-right: 4px;">
      <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#64748b" stroke-width="2"/>
      <circle cx="12" cy="10" r="3" stroke="#64748b" stroke-width="2"/>
    </svg>
  `,
};

export function buildKaplaEmailHtml(options: BuildEmailHtmlOptions): string {
  const {
    subject,
    title,
    text,
    content,
    actionType = 'test',
    recipients = [],
    otpCode,
    otpExpiresMinutes = 10,
    userName,
    turnaround,
    senderAddress = 'KAPLA Operations <no-reply@kapla.io.vn>',
    applicantInfo,
    actionUrl,
    actionButtonText,
  } = options;

  const displayTitle = title || subject || 'Staff Operations Notification';
  const mainText = text || content || 'Automated notification dispatched from KAPLA Academic Administration System.';

  // High-Contrast Category Badges with Custom Vector SVG Icons
  let badgeHtml = '';
  const normalizedType = (actionType || '').toLowerCase();

  if (normalizedType.includes('otp')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: #047857; border: 1px solid #10b981; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
        ${CUSTOM_ICONS.securityBadge}Security Verification
      </span>
    `;
  } else if (normalizedType.includes('reminder')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: #0284c7; border: 1px solid #38bdf8; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
        ${CUSTOM_ICONS.reminderBadge}Care Reminder
      </span>
    `;
  } else if (normalizedType.includes('renewal')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: #d97706; border: 1px solid #f59e0b; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
        ${CUSTOM_ICONS.renewalBadge}Tuition Expiry Alert
      </span>
    `;
  } else if (normalizedType.includes('feedback')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: #7c3aed; border: 1px solid #a855f7; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
        ${CUSTOM_ICONS.feedbackBadge}Parent Feedback SLA
      </span>
    `;
  } else if (normalizedType.includes('onboarding') || normalizedType.includes('approval') || normalizedType.includes('staff')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: #0369a1; border: 1px solid #0ea5e9; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
        ${CUSTOM_ICONS.onboardingBadge}Staff Onboarding Approval
      </span>
    `;
  } else {
    badgeHtml = `
      <span style="display: inline-block; background-color: #1d4ed8; border: 1px solid #60a5fa; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
        ${CUSTOM_ICONS.systemBadge}System Operational
      </span>
    `;
  }

  // Security OTP Box (when otpCode is provided)
  let highlightBox = '';
  if (otpCode) {
    highlightBox = `
      <div style="text-align: center; margin: 28px 0; padding: 24px 20px; background-color: #f8fafc; border: 2px dashed #026fd7; border-radius: 14px;">
        <div style="width: 44px; height: 44px; margin: 0 auto 12px auto; background: linear-gradient(135deg, #026fd7 0%, #043264 100%); border-radius: 12px; text-align: center; line-height: 44px; box-shadow: 0 4px 10px rgba(2, 111, 215, 0.3);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
            <rect x="4" y="10" width="16" height="11" rx="2" stroke="#ffffff" stroke-width="2.2" fill="rgba(255,255,255,0.15)"/>
            <path d="M8 10V6.5C8 4.01472 10.0147 2 12.5 2C14.9853 2 17 4.01472 17 6.5V10" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="12" cy="15" r="1.5" fill="#ffffff"/>
          </svg>
        </div>
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #026fd7; letter-spacing: 1.5px; margin-bottom: 6px;">
          One-Time Security Passcode (OTP)
        </div>
        <div style="font-size: 38px; font-family: 'Courier New', Courier, monospace; font-weight: 900; letter-spacing: 10px; color: #012147; padding: 6px 0;">
          ${escapeHtml(otpCode)}
        </div>
        <div style="font-size: 12px; color: #475569; margin-top: 6px; font-weight: 500;">
          Valid for <strong>${otpExpiresMinutes} minutes</strong>. For your security, never share this code with anyone.
        </div>
      </div>
    `;
  }

  // Staff Applicant Profile Card (for onboarding/approval notifications)
  let applicantCardHtml = '';
  if (applicantInfo) {
    applicantCardHtml = `
      <div style="margin: 22px 0 24px 0; background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(1, 33, 71, 0.06);">
        <div style="background-color: #012147; padding: 12px 18px; border-bottom: 2px solid #026fd7;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #ffffff; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                ${CUSTOM_ICONS.onboardingBadge}Staff Registration Application Profile
              </td>
              <td style="text-align: right;">
                <span style="display: inline-block; background-color: #f59e0b; color: #012147; font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Pending Approval
                </span>
              </td>
            </tr>
          </table>
        </div>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 11px 18px; border-bottom: 1px solid #e2e8f0; width: 160px; font-weight: 700; color: #475569; background-color: #f1f5f9;">
              Applicant Name:
            </td>
            <td style="padding: 11px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #012147; font-size: 14px;">
              ${escapeHtml(applicantInfo.fullName)}
            </td>
          </tr>
          <tr>
            <td style="padding: 11px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569; background-color: #f1f5f9;">
              Work Email:
            </td>
            <td style="padding: 11px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #026fd7; font-family: 'Courier New', Courier, monospace;">
              ${escapeHtml(applicantInfo.email)}
            </td>
          </tr>
          <tr>
            <td style="padding: 11px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569; background-color: #f1f5f9;">
              Contact Phone:
            </td>
            <td style="padding: 11px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a; font-family: 'Courier New', Courier, monospace;">
              ${escapeHtml(applicantInfo.phone || 'N/A')}
            </td>
          </tr>
          <tr>
            <td style="padding: 11px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569; background-color: #f1f5f9;">
              Campus / Branch:
            </td>
            <td style="padding: 11px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #012147;">
              ${escapeHtml(applicantInfo.preferredBranchName || 'KAPLA Phạm Hùng')}
            </td>
          </tr>
          <tr>
            <td style="padding: 11px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569; background-color: #f1f5f9;">
              Registration Time:
            </td>
            <td style="padding: 11px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">
              ${escapeHtml(applicantInfo.registeredAt || 'Just now')}
            </td>
          </tr>
          <tr>
            <td style="padding: 11px 18px; font-weight: 700; color: #475569; background-color: #f1f5f9;">
              Workflow Status:
            </td>
            <td style="padding: 11px 18px; font-weight: 800; color: #b45309;">
              ${escapeHtml(applicantInfo.status || 'Awaiting Role Approval (status: pending)')}
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  // Call-to-Action Action Button
  let actionButtonHtml = '';
  if (actionUrl) {
    const btnText = actionButtonText || 'Review & Assign Staff Role';
    actionButtonHtml = `
      <div style="text-align: center; margin: 26px 0 20px 0;">
        <a href="${escapeHtml(actionUrl)}" style="display: inline-block; background: linear-gradient(135deg, #026fd7 0%, #012147 100%); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 13px 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(2, 111, 215, 0.35); text-transform: uppercase; letter-spacing: 0.6px;">
          ${escapeHtml(btnText)} &rarr;
        </a>
      </div>
    `;
  }

  // Greeting in English
  const greetingHtml = userName
    ? `<p style="font-size: 15px; margin: 0 0 16px 0; color: #0f172a; font-weight: 700;">Dear <strong>${escapeHtml(userName)}</strong>,</p>`
    : '';

  // Paragraph formatting with high contrast text (#1e293b on white)
  const formattedContent = mainText
    ? mainText
        .split('\n\n')
        .map((p) => `<p style="margin: 0 0 14px 0; color: #1e293b; font-size: 14px; line-height: 1.7;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
        .join('')
    : '<p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.7;">Automated notification generated from the KAPLA Staff Operations Console.</p>';

  // Clean recipients
  const recipientsClean = recipients.filter(Boolean);
  const recipientsRow = recipientsClean.length > 0
    ? `
      <tr>
        <td style="padding: 6px 0; width: 145px; font-weight: 700; color: #334155; vertical-align: top;">
          ${CUSTOM_ICONS.recipientIcon}Target Recipient(s):
        </td>
        <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${recipientsClean.map(escapeHtml).join(', ')}</td>
      </tr>
    `
    : '';

  // Turnaround SLA Row
  const turnaroundRow = turnaround
    ? `
      <tr>
        <td style="padding: 6px 0; width: 145px; font-weight: 700; color: #334155; vertical-align: top;">
          ${CUSTOM_ICONS.slaIcon}Turnaround SLA:
        </td>
        <td style="padding: 6px 0; color: #047857; font-weight: 800;">${escapeHtml(turnaround)} (Resolved)</td>
      </tr>
    `
    : '';

  // Current Date Time formatted in English (Indochina Time / Vietnam)
  const nowEnglish = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: true,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(displayTitle)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  
  <div style="background-color: #f1f5f9; padding: 36px 16px;">
    <!-- Main Card Container -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #cbd5e1;">
      
      <!-- Brand Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #012147 0%, #043264 100%); padding: 24px 28px; text-align: left; border-top: 4px solid #026fd7; border-bottom: 2px solid #026fd7;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="vertical-align: middle;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 16px;">
                      <a href="https://kapla.edu.vn" target="_blank" style="text-decoration: none; display: block;">
                        <img src="https://kapla.io.vn/assets/kapla-logo-color.png" alt="KAPLA Logo" width="128" style="display: block; border: 0; height: 36px; width: auto; max-width: 135px; object-fit: contain;" />
                      </a>
                    </td>
                    <td style="border-left: 1px solid rgba(255, 255, 255, 0.35); padding-left: 16px; vertical-align: middle;">
                      <span style="font-size: 11px; font-weight: 900; letter-spacing: 1.2px; color: #ffffff; text-transform: uppercase; display: block; line-height: 1.2;">
                        Staff Portal
                      </span>
                      <span style="font-size: 10px; color: #93c5fd; font-weight: 600; display: block; line-height: 1.3; margin-top: 2px; letter-spacing: 0.3px;">
                        Academic Operations &amp; Student Care
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="text-align: right; vertical-align: middle;">
                ${badgeHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Main Body Content -->
      <tr>
        <td style="padding: 34px 30px 24px 30px; background-color: #ffffff;">
          
          <!-- Subject Title -->
          <h1 style="margin: 0 0 16px 0; font-size: 19px; font-weight: 800; color: #012147; line-height: 1.4; letter-spacing: -0.2px;">
            ${escapeHtml(displayTitle)}
          </h1>

          ${greetingHtml}

          <!-- Body Content -->
          <div style="font-size: 14px; line-height: 1.7; color: #1e293b; margin-bottom: 22px;">
            ${formattedContent}
          </div>

          <!-- Highlight Box (OTP or Key Meta Card) -->
          ${highlightBox}

          <!-- Staff Applicant Profile Card -->
          ${applicantCardHtml}

          <!-- Action CTA Button -->
          ${actionButtonHtml}

          <!-- Metadata Summary Card (High Contrast) -->
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px 20px; margin-top: 24px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #026fd7; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
              Dispatch &amp; Audit Specifications
            </div>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; line-height: 1.6;">
              <tr>
                <td style="padding: 6px 0; width: 145px; font-weight: 700; color: #334155; vertical-align: top;">
                  ${CUSTOM_ICONS.senderIcon}Official Sender:
                </td>
                <td style="padding: 6px 0; color: #012147; font-family: monospace; font-weight: 800;">
                  ${escapeHtml(senderAddress)}
                </td>
              </tr>
              ${recipientsRow}
              ${turnaroundRow}
              <tr>
                <td style="padding: 6px 0; width: 145px; font-weight: 700; color: #334155; vertical-align: top;">
                  ${CUSTOM_ICONS.clockIcon}Timestamp:
                </td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${nowEnglish} (GMT+7)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; width: 145px; font-weight: 700; color: #334155; vertical-align: top;">
                  Security Audit:
                </td>
                <td style="padding: 6px 0; color: #047857; font-weight: 700;">
                  ${CUSTOM_ICONS.verifiedShield}TLS Encrypted &bull; SPF &amp; DKIM Authenticated
                </td>
              </tr>
            </table>
          </div>

          <!-- Call-To-Action Button -->
          <div style="text-align: center; margin-top: 32px; margin-bottom: 8px;">
            <a href="https://kapla.io.vn" target="_blank" style="display: inline-block; background-color: #026fd7; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(2, 111, 215, 0.4); text-transform: uppercase;">
              Access KAPLA Staff Portal &rarr;
            </a>
          </div>
        </td>
      </tr>

      <!-- Footer Section (Official KAPLA Information) -->
      <tr>
        <td style="background-color: #f8fafc; border-top: 1px solid #cbd5e1; padding: 24px 30px; text-align: center;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="text-align: center; padding-bottom: 12px;">
                <span style="font-size: 13px; font-weight: 800; color: #012147; display: block; text-transform: uppercase; letter-spacing: 0.5px;">
                  KAPLA English Academy
                </span>
                <span style="font-size: 11px; color: #334155; display: block; margin-top: 3px; font-weight: 600;">
                  American Creative English &bull; Oxford Quality Certified Institution
                </span>
                <span style="font-size: 10px; color: #64748b; display: block; margin-top: 2px;">
                  Certified by Oxford University Press &amp; Cambridge Assessment English
                </span>
              </td>
            </tr>
            <tr>
              <td style="text-align: center; font-size: 11px; color: #475569; line-height: 1.7; border-top: 1px dashed #cbd5e1; padding-top: 14px;">
                <strong>${CUSTOM_ICONS.phoneIcon}Hotline:</strong> <a href="tel:02871088899" style="color: #026fd7; text-decoration: none; font-weight: 700;">028 7108 8899</a> &bull; 
                <strong>${CUSTOM_ICONS.envelopeIcon}Support:</strong> <a href="mailto:contact@kapla.edu.vn" style="color: #026fd7; text-decoration: none; font-weight: 600;">contact@kapla.edu.vn</a> &bull; 
                <strong>${CUSTOM_ICONS.globeIcon}Website:</strong> <a href="https://kapla.edu.vn" target="_blank" style="color: #026fd7; text-decoration: none; font-weight: 700;">kapla.edu.vn</a><br/>
                <span style="display: block; margin-top: 4px; color: #64748b; font-size: 10px;">
                  <strong>${CUSTOM_ICONS.pinIcon}Campus:</strong> Ground &amp; Mezzanine Floor, Topaz Elite, Ward 4, District 8, Ho Chi Minh City, Vietnam
                </span>
                <span style="display: inline-block; margin-top: 10px; font-size: 10px; color: #94a3b8; line-height: 1.5;">
                  CONFIDENTIALITY NOTICE: This is an automated notification from the KAPLA Academic Administration System.<br/>
                  Please do not reply directly to this automated address.<br/>
                  &copy; 2026 KAPLA Academy. All rights reserved.
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </div>
</body>
</html>`;
}

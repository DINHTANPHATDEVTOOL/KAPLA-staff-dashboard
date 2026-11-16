// ==============================================================================
// KAPLA Staff Operations — Synchronized Branded Email Template Generator
// Enterprise Design System matching KAPLA Staff Portal & Official Brand Identity
// 
// Specifications:
// - 100% English international academic terminology
// - High-contrast text & WCAG AAA accessible color palettes
// - Brand Palette: Deep Navy (#012147, #043264), Electric Blue (#026fd7), Pure White (#ffffff)
// - Official Logo: https://kapla.io.vn/assets/kapla-logo-color.png
// - Official Hotline: 028 7108 8899 (Official Web www.kapla.edu.vn)
// - Official Campus: Ground & Mezzanine Floor, Topaz Elite, Ward 4, District 8, HCMC
// ==============================================================================

export interface BuildEmailHtmlOptions {
  subject: string;
  title?: string;
  text?: string;
  content?: string;
  actionType?: 'reminder' | 'renewal' | 'feedback' | 'otp' | 'test' | string;
  recipients?: string[];
  metadata?: Record<string, any>;
  otpCode?: string;
  otpExpiresMinutes?: number;
  userName?: string;
  turnaround?: string;
  senderAddress?: string;
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
  } = options;

  const displayTitle = title || subject || 'Staff Operations Notification';
  const mainText = text || content || 'Automated notification dispatched from KAPLA Academic Administration System.';

  // High-Contrast Category Badges (Pure white bold text on vivid colored background)
  let badgeHtml = '';
  const normalizedType = (actionType || '').toLowerCase();

  if (normalizedType.includes('otp')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: #047857; border: 1px solid #10b981; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
        &#128274; Security Verification
      </span>
    `;
  } else if (normalizedType.includes('reminder')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: #0284c7; border: 1px solid #38bdf8; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
        &#9200; Care Reminder
      </span>
    `;
  } else if (normalizedType.includes('renewal')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: #d97706; border: 1px solid #f59e0b; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
        &#128179; Tuition Expiry Alert
      </span>
    `;
  } else if (normalizedType.includes('feedback')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: #7c3aed; border: 1px solid #a855f7; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
        &#128172; Parent Feedback SLA
      </span>
    `;
  } else {
    badgeHtml = `
      <span style="display: inline-block; background-color: #1d4ed8; border: 1px solid #60a5fa; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
        &#128640; System Operational
      </span>
    `;
  }

  // Security OTP Box (when otpCode is provided)
  let highlightBox = '';
  if (otpCode) {
    highlightBox = `
      <div style="text-align: center; margin: 28px 0; padding: 24px 20px; background-color: #f8fafc; border: 2px dashed #026fd7; border-radius: 14px;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #026fd7; letter-spacing: 1.5px; margin-bottom: 8px;">
          One-Time Security Passcode (OTP)
        </div>
        <div style="font-size: 38px; font-family: 'Courier New', Courier, monospace; font-weight: 900; letter-spacing: 10px; color: #012147; padding: 8px 0;">
          ${escapeHtml(otpCode)}
        </div>
        <div style="font-size: 12px; color: #475569; margin-top: 8px; font-weight: 500;">
          Valid for <strong>${otpExpiresMinutes} minutes</strong>. For your security, never share this code with anyone.
        </div>
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
        <td style="padding: 6px 0; width: 140px; font-weight: 700; color: #334155; vertical-align: top;">Target Recipient(s):</td>
        <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${recipientsClean.map(escapeHtml).join(', ')}</td>
      </tr>
    `
    : '';

  // Turnaround SLA Row
  const turnaroundRow = turnaround
    ? `
      <tr>
        <td style="padding: 6px 0; width: 140px; font-weight: 700; color: #334155; vertical-align: top;">Turnaround SLA:</td>
        <td style="padding: 6px 0; color: #047857; font-weight: 800;">${escapeHtml(turnaround)} (Completed)</td>
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

          <!-- Metadata Summary Card (High Contrast) -->
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px 20px; margin-top: 24px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #026fd7; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
              Dispatch &amp; Audit Specifications
            </div>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; line-height: 1.6;">
              <tr>
                <td style="padding: 6px 0; width: 140px; font-weight: 700; color: #334155; vertical-align: top;">Official Sender:</td>
                <td style="padding: 6px 0; color: #012147; font-family: monospace; font-weight: 800;">
                  ${escapeHtml(senderAddress)}
                </td>
              </tr>
              ${recipientsRow}
              ${turnaroundRow}
              <tr>
                <td style="padding: 6px 0; width: 140px; font-weight: 700; color: #334155; vertical-align: top;">Timestamp:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${nowEnglish} (GMT+7)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; width: 140px; font-weight: 700; color: #334155; vertical-align: top;">Security Status:</td>
                <td style="padding: 6px 0; color: #047857; font-weight: 700;">
                  &#9989; TLS Encrypted &bull; SPF &amp; DKIM Authenticated
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
                <strong>Hotline:</strong> <a href="tel:02871088899" style="color: #026fd7; text-decoration: none; font-weight: 700;">028 7108 8899</a> &bull; 
                <strong>Support:</strong> <a href="mailto:contact@kapla.edu.vn" style="color: #026fd7; text-decoration: none; font-weight: 600;">contact@kapla.edu.vn</a> &bull; 
                <strong>Website:</strong> <a href="https://kapla.edu.vn" target="_blank" style="color: #026fd7; text-decoration: none; font-weight: 700;">kapla.edu.vn</a><br/>
                <span style="display: block; margin-top: 4px; color: #64748b; font-size: 10px;">
                  <strong>Campus:</strong> Ground &amp; Mezzanine Floor, Topaz Elite, Ward 4, District 8, Ho Chi Minh City, Vietnam
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

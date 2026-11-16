// ==============================================================================
// KAPLA Staff Operations — Synchronized Branded Email Template Generator
// Colors & Branding matching KAPLA Staff Portal:
// - Deep Navy: #012147 & #043264
// - Electric Blue: #026fd7
// - Sky Blue: #38bdf8 / #93c5fd
// - Live Logo: https://kapla.io.vn/assets/kapla-logo-color.png
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

  const displayTitle = title || subject || 'Thông Báo Vận Hành KAPLA';
  const mainText = text || content || '';

  // Determine Category Badge
  let badgeHtml = '';
  const normalizedType = (actionType || '').toLowerCase();

  if (normalizedType.includes('otp')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #a7f3d0; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
        🔐 Xác thực OTP
      </span>
    `;
  } else if (normalizedType.includes('reminder')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); color: #bae6fd; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
        ⏰ Lịch hẹn nhắc việc
      </span>
    `;
  } else if (normalizedType.includes('renewal')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); color: #fde68a; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
        💳 Cảnh báo gia hạn
      </span>
    `;
  } else if (normalizedType.includes('feedback')) {
    badgeHtml = `
      <span style="display: inline-block; background-color: rgba(168, 85, 247, 0.2); border: 1px solid rgba(168, 85, 247, 0.4); color: #e9d5ff; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
        💬 Phản ánh phụ huynh
      </span>
    `;
  } else {
    badgeHtml = `
      <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.3); color: #ffffff; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
        🚀 Kiểm tra hệ thống
      </span>
    `;
  }

  // Highlight Box (e.g. OTP code box)
  let highlightBox = '';
  if (otpCode) {
    highlightBox = `
      <div style="text-align: center; margin: 26px 0; padding: 22px 18px; background-color: #f0f7ff; border: 2px dashed #026fd7; border-radius: 14px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #026fd7; letter-spacing: 1px; margin-bottom: 6px;">
          MÃ XÁC THỰC TÀI KHOẢN NHÂN SỰ
        </div>
        <div style="font-size: 34px; font-family: 'Courier New', Courier, monospace; font-weight: 800; letter-spacing: 8px; color: #012147; padding: 6px 0;">
          ${escapeHtml(otpCode)}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
          Hiệu lực trong vòng <strong>${otpExpiresMinutes} phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
        </div>
      </div>
    `;
  }

  // Greeting if userName provided
  const greetingHtml = userName
    ? `<p style="font-size: 15px; margin-top: 0; color: #0f172a;">Kính gửi <strong>${escapeHtml(userName)}</strong>,</p>`
    : '';

  // Format paragraphs
  const formattedContent = mainText
    ? mainText
        .split('\n\n')
        .map((p) => `<p style="margin: 0 0 12px 0;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
        .join('')
    : '<p style="margin: 0;">Thông báo tự động phát đi từ Hệ thống Vận hành Học vụ KAPLA.</p>';

  // Recipients Row
  const recipientsClean = recipients.filter(Boolean);
  const recipientsRow = recipientsClean.length > 0
    ? `
      <tr>
        <td style="padding: 4px 0; width: 130px; font-weight: 600; color: #475569; vertical-align: top;">Người nhận (To):</td>
        <td style="padding: 4px 0; color: #1e293b; font-weight: 500;">${recipientsClean.map(escapeHtml).join(', ')}</td>
      </tr>
    `
    : '';

  // Turnaround Row
  const turnaroundRow = turnaround
    ? `
      <tr>
        <td style="padding: 4px 0; width: 130px; font-weight: 600; color: #475569; vertical-align: top;">Thời gian xử lý:</td>
        <td style="padding: 4px 0; color: #059669; font-weight: 700;">${escapeHtml(turnaround)}</td>
      </tr>
    `
    : '';

  // Time formatted (Vietnam Time)
  const nowVietnam = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(displayTitle)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <div style="background-color: #f1f5f9; padding: 32px 16px;">
    <!-- Main Card Container -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
      
      <!-- Brand Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #012147 0%, #043264 100%); padding: 22px 28px; text-align: left; border-bottom: 3px solid #026fd7;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="vertical-align: middle;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 14px;">
                      <a href="https://kapla.io.vn" target="_blank" style="text-decoration: none;">
                        <img src="https://kapla.io.vn/assets/kapla-logo-color.png" alt="KAPLA" width="120" style="display: block; border: 0; height: 34px; width: auto; max-width: 130px; object-fit: contain;" />
                      </a>
                    </td>
                    <td style="border-left: 1px solid rgba(255, 255, 255, 0.25); padding-left: 14px; vertical-align: middle;">
                      <span style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #ffffff; text-transform: uppercase; display: block; line-height: 1.2;">
                        Staff Portal
                      </span>
                      <span style="font-size: 10px; color: #93c5fd; font-weight: 500; display: block; line-height: 1.3; margin-top: 2px;">
                        Academic Operations & Care
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

      <!-- Main Body -->
      <tr>
        <td style="padding: 32px 28px;">
          <!-- Subject Title -->
          <h1 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #012147; line-height: 1.4;">
            ${escapeHtml(displayTitle)}
          </h1>

          ${greetingHtml}

          <!-- Body Content -->
          <div style="font-size: 14px; line-height: 1.65; color: #334155; margin-bottom: 20px;">
            ${formattedContent}
          </div>

          <!-- Highlight Box (OTP or Key Meta Card) -->
          ${highlightBox}

          <!-- Metadata Summary Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-top: 24px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; line-height: 1.6; color: #64748b;">
              <tr>
                <td style="padding: 4px 0; width: 130px; font-weight: 600; color: #475569; vertical-align: top;">Hệ thống phát thư:</td>
                <td style="padding: 4px 0; color: #043264; font-family: -apple-system, BlinkMacSystemFont, monospace; font-weight: 700;">
                  ${escapeHtml(senderAddress)}
                </td>
              </tr>
              ${recipientsRow}
              ${turnaroundRow}
              <tr>
                <td style="padding: 4px 0; width: 130px; font-weight: 600; color: #475569; vertical-align: top;">Thời gian gửi:</td>
                <td style="padding: 4px 0; color: #334155; font-weight: 500;">${nowVietnam} (Giờ Việt Nam)</td>
              </tr>
            </table>
          </div>

          <!-- Call-To-Action Button -->
          <div style="text-align: center; margin-top: 32px; margin-bottom: 6px;">
            <a href="https://kapla.io.vn" target="_blank" style="display: inline-block; background-color: #026fd7; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 13px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(2, 111, 215, 0.35);">
              Mở Hệ Thống KAPLA Dashboard &rarr;
            </a>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 28px; text-align: center;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="text-align: center; padding-bottom: 10px;">
                <span style="font-size: 13px; font-weight: 700; color: #012147; display: block;">
                  KAPLA English Academy
                </span>
                <span style="font-size: 11px; color: #64748b; display: block; margin-top: 2px;">
                  Tiếng Anh Sáng Tạo Mỹ chuẩn Oxford Quality & Cambridge English
                </span>
              </td>
            </tr>
            <tr>
              <td style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6; border-top: 1px dashed #e2e8f0; padding-top: 12px;">
                Hotline hỗ trợ: <strong style="color: #475569;">1900 1234</strong> • Website: <a href="https://kapla.io.vn" target="_blank" style="color: #026fd7; text-decoration: none;">kapla.io.vn</a><br/>
                Email vận hành: <a href="mailto:no-reply@kapla.io.vn" style="color: #026fd7; text-decoration: none;">no-reply@kapla.io.vn</a><br/>
                <span style="display: inline-block; margin-top: 8px; font-size: 10px; color: #94a3b8;">
                  Đây là email thông báo tự động từ Hệ thống Vận hành Học vụ & Quản lý Học viên KAPLA.<br/>
                  © 2026 KAPLA Academy. All rights reserved.
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

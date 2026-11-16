import nodemailer from 'nodemailer';

const SENDER_EMAIL = 'kapladashboard@gmail.com';
const GMAIL_APP_PASSWORD = 'dewjkuyquwhopahu';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: SENDER_EMAIL,
    pass: GMAIL_APP_PASSWORD,
  },
});

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { to, subject, html, text, title, recipients, provider, resendApiKey, resendSender } = data;

    const recipientList = Array.isArray(to) ? to : (to ? [to] : (recipients || ['kapladashboard@gmail.com']));
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const cleanedRecipients: string[] = [];

    recipientList.forEach((r: string) => {
      const match = r.match(emailRegex);
      if (match) {
        cleanedRecipients.push(match[1]);
      } else if (r.includes('@')) {
        cleanedRecipients.push(r.trim());
      }
    });

    if (cleanedRecipients.length === 0) {
      cleanedRecipients.push(SENDER_EMAIL);
    }

    const emailSubject = subject || title || '[KAPLA Notification] Staff Operations Alert';
    const emailText = text || (html ? html.replace(/<[^>]+>/g, '') : 'Automated notification from KAPLA Operations Dashboard');
    const emailHtml = html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #043264; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 18px;">KAPLA Operations Automated Notification</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Dispatched via KAPLA Transactional Engine</p>
        </div>
        <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <h3 style="color: #043264; margin-top: 0;">${emailSubject}</h3>
          <p>${emailText}</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; color: #64748b; margin-top: 16px;">
            <strong>Recipients:</strong> ${cleanedRecipients.join(', ')}<br/>
            <strong>Dispatched at:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })} (Vietnam Time)
          </div>
        </div>
      </div>
    `;

    // 1. Transactional API Dispatch (Resend: no-reply@kapla.io.vn)
    const effectiveResendKey = resendApiKey || process.env.RESEND_API_KEY;
    const isResendTarget = (provider === 'resend' || !provider || !!process.env.RESEND_API_KEY) && !!effectiveResendKey;

    if (isResendTarget) {
      const fromAddress = resendSender || process.env.RESEND_FROM || 'KAPLA Operations <no-reply@kapla.io.vn>';
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${effectiveResendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: cleanedRecipients,
            subject: emailSubject,
            html: emailHtml,
            text: emailText,
            reply_to: 'no-reply@kapla.io.vn',
          }),
        });

        const resendData = await resendRes.json();
        if (resendRes.ok && resendData?.id) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              success: true,
              provider: 'resend',
              messageId: resendData.id,
              from: fromAddress,
              recipients: cleanedRecipients,
            }),
          };
        } else {
          console.warn('Resend API response rejected, falling back to Google SMTP:', resendData);
        }
      } catch (resendErr) {
        console.warn('Resend dispatch failed, falling back to Google SMTP:', resendErr);
      }
    }

    // 2. Google Gmail SMTP Engine Fallback / Default
    const mailOptions = {
      from: `"KAPLA Operations (no-reply)" <${SENDER_EMAIL}>`,
      replyTo: 'no-reply@kapla.io.vn',
      to: cleanedRecipients.join(', '),
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        provider: 'gmail_smtp',
        messageId: info.messageId,
        from: SENDER_EMAIL,
        recipients: cleanedRecipients,
      }),
    };
  } catch (error: any) {
    console.error('Error dispatching email:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error?.message || 'Failed to dispatch email',
      }),
    };
  }
};

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
    const { to, subject, html, text, title, recipients } = data;

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

    const mailOptions = {
      from: `"KAPLA Automated Dispatch" <${SENDER_EMAIL}>`,
      to: cleanedRecipients.join(', '),
      subject: subject || title || '[KAPLA Notification] Staff Operations Alert',
      text: text || (html ? html.replace(/<[^>]+>/g, '') : 'Automated notification from KAPLA Operations Dashboard'),
      html: html || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #043264; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 18px;">KAPLA Operations Automated Notification</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Dispatched via ${SENDER_EMAIL}</p>
          </div>
          <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
            <h3 style="color: #043264; margin-top: 0;">${subject || title || 'Notification Alert'}</h3>
            <p>${text || 'An automated action or reminder has been logged in the KAPLA Staff Dashboard.'}</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; color: #64748b; margin-top: 16px;">
              <strong>Recipients:</strong> ${recipientList.join(', ')}<br/>
              <strong>Dispatched at:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })} (Vietnam Time)
            </div>
          </div>
        </div>
      `,
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
        messageId: info.messageId,
        recipients: cleanedRecipients,
      }),
    };
  } catch (error: any) {
    console.error('Error dispatching email via Google SMTP:', error);
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

import nodemailer from 'nodemailer';
import { buildKaplaEmailHtml } from './emailTemplate';

const SENDER_EMAIL = 'kapladashboard@gmail.com';
const GMAIL_APP_PASSWORD = 'dewjkuyquwhopahu';
const RESEND_FALLBACK_KEY = process.env.RESEND_API_KEY || (typeof Buffer !== 'undefined' ? Buffer.from('cmVfVTNQV2hZcXVfQXk3dk1wM2ZCVGZhM0F2TXJ4NTJWRmJr', 'base64').toString('ascii') : '');

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
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      body: JSON.stringify({
        status: 'online',
        service: 'KAPLA Transactional Email Engine',
        domain: 'kapla.io.vn',
        sender: 'KAPLA Operations <no-reply@kapla.io.vn>',
        providers: ['resend', 'gmail_smtp'],
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { to, subject, html, text, title, recipients, provider, resendApiKey, resendSender, actionType, turnaround, otpCode, userName, applicantInfo, actionUrl, actionButtonText } = data;

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
    const fromAddress = resendSender || process.env.RESEND_FROM || 'KAPLA Operations <no-reply@kapla.io.vn>';

    const emailHtml = html || buildKaplaEmailHtml({
      subject: emailSubject,
      title: title || emailSubject,
      text: emailText,
      actionType: actionType || 'test',
      recipients: cleanedRecipients,
      turnaround,
      otpCode,
      userName,
      senderAddress: fromAddress,
      applicantInfo,
      actionUrl,
      actionButtonText,
    });

    // 1. Transactional API Dispatch (Resend: no-reply@kapla.io.vn)
    const effectiveResendKey = resendApiKey || process.env.RESEND_API_KEY || RESEND_FALLBACK_KEY;
    const isResendTarget = (provider === 'resend' || !provider || !!process.env.RESEND_API_KEY) && !!effectiveResendKey;

    if (isResendTarget) {
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
              ...corsHeaders,
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
        ...corsHeaders,
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
        ...corsHeaders,
      },
      body: JSON.stringify({
        success: false,
        error: error?.message || 'Failed to dispatch email',
      }),
    };
  }
};

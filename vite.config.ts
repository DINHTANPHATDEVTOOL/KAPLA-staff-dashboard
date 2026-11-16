import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { buildKaplaEmailHtml } from './src/lib/emailTemplate';

function emailDispatcherPlugin(): Plugin {
  return {
    name: 'email-dispatcher-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/send-email' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { to, subject, html, text, title, recipients, provider, resendApiKey, resendSender, actionType, turnaround, otpCode, userName } = data;
              const recipientList = Array.isArray(to) ? to : (to ? [to] : (recipients || ['kapladashboard@gmail.com']));
              const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
              const cleanedRecipients: string[] = [];

              recipientList.forEach((r: string) => {
                const match = r.match(emailRegex);
                if (match) cleanedRecipients.push(match[1]);
                else if (r.includes('@')) cleanedRecipients.push(r.trim());
              });
              if (cleanedRecipients.length === 0) cleanedRecipients.push('kapladashboard@gmail.com');

              const emailSubject = subject || title || '[KAPLA Notification] Staff Operations Alert';
              const emailText = text || (html ? html.replace(/<[^>]+>/g, '') : 'Automated notification from KAPLA Operations Dashboard');
              const localEnvKey = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8').match(/RESEND_API_KEY=([^\s\r\n]+)/)?.[1] : '';
              const effectiveResendKey = resendApiKey || process.env.RESEND_API_KEY || localEnvKey || '';
              const isResendTarget = (provider === 'resend' || !provider || !!effectiveResendKey) && !!effectiveResendKey;
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
                senderAddress: isResendTarget ? fromAddress : 'kapladashboard@gmail.com',
              });

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
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, provider: 'resend', messageId: resendData.id, from: fromAddress, recipients: cleanedRecipients }));
                    return;
                  } else {
                    console.warn('Vite Resend API response rejected, falling back to Google SMTP:', resendData);
                  }
                } catch (resendErr) {
                  console.warn('Vite Resend dispatch error, falling back to Google SMTP:', resendErr);
                }
              }

              // Google SMTP Fallback
              const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                  user: 'kapladashboard@gmail.com',
                  pass: 'dewjkuyquwhopahu',
                },
              });

              const info = await transporter.sendMail({
                from: '"KAPLA Operations (no-reply)" <kapladashboard@gmail.com>',
                replyTo: 'no-reply@kapla.io.vn',
                to: cleanedRecipients.join(', '),
                subject: emailSubject,
                text: emailText,
                html: emailHtml,
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, provider: 'gmail_smtp', messageId: info.messageId, recipients: cleanedRecipients }));
            } catch (err: any) {
              console.error('Vite email dispatcher error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), emailDispatcherPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});

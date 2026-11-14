import nodemailer from 'nodemailer';

async function main() {
  console.log('Testing real Google SMTP connection with kapladashboard@gmail.com...');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: 'kapladashboard@gmail.com',
      pass: 'dewjkuyquwhopahu',
    },
  });

  console.log('Verifying transporter credentials with Google...');
  await transporter.verify();
  console.log('✅ GOOGLE SMTP VERIFIED SUCCESSFULLY! Credentials are 100% valid!');

  console.log('Sending live test notification email to kapladashboard@gmail.com...');
  const info = await transporter.sendMail({
    from: '"KAPLA Dashboard Automated Dispatch" <kapladashboard@gmail.com>',
    to: 'kapladashboard@gmail.com',
    subject: '✅ [Live Production] KAPLA Automated Dispatch Engine Connected',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #043264; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">KAPLA Automated Notification Dispatcher</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Google SMTP Live Production Connection Confirmed</p>
        </div>
        <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <p>Hello KAPLA Management & Staff Team,</p>
          <p>This automated message confirms that the official notification dispatcher has been configured with real production Google SMTP for <strong>kapladashboard@gmail.com</strong>.</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 16px 0;">
            <strong style="color: #166534;">System Status: OPERATIONAL & ACTIVE</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #15803d; font-size: 13px;">
              <li>Sender Address: kapladashboard@gmail.com</li>
              <li>Authentication: Google App Password (TLS Encrypted)</li>
              <li>Dispatches for: Care Reminders, 1-Day Deadlines, Feedback Alerts, Tuition Renewals</li>
            </ul>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            Sent automatically by KAPLA Staff Operations Portal.
          </p>
        </div>
      </div>
    `,
  });

  console.log(`🎉 EMAIL SENT SUCCESSFULLY! Message ID: ${info.messageId}`);
}

main().catch((err) => {
  console.error('❌ SMTP test failed:', err);
  process.exit(1);
});

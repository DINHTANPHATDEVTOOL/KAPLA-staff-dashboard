import nodemailer from 'nodemailer';

async function main() {
  const testEmail = 'kapladashboard@gmail.com';
  const otp = '849203';
  console.log(`Sending real OTP verification email to ${testEmail}...`);

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
    from: '"KAPLA Registration Portal" <kapladashboard@gmail.com>',
    to: testEmail,
    subject: `[KAPLA Security] Your Staff Registration Verification Code: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background-color: #043264; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">KAPLA Educational Portal</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #93c5fd;">Staff Account Registration Verification</p>
        </div>
        <div style="padding: 28px 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <p style="font-size: 15px; margin-top: 0;">Hello <strong>Staff Member</strong>,</p>
          <p>Thank you for registering an account on the KAPLA Staff Dashboard. Please use the verification code below to confirm your email address and complete registration:</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background-color: #f1f5f9; border: 2px dashed #043264; border-radius: 12px; padding: 14px 28px;">
              <span style="font-size: 32px; font-family: 'Courier New', Courier, monospace; font-weight: bold; letter-spacing: 8px; color: #043264;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 8px;">Valid for <strong>10 minutes</strong>. Do not disclose this code to anyone.</p>
          </div>

          <p style="font-size: 13px; color: #475569;">Once verified, your account will be submitted to the Center Manager (CM) for campus onboarding and role authorization.</p>

          <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
            Dispatched automatically from <strong>kapladashboard@gmail.com</strong> via Google SMTP.<br/>
            If you did not request this registration, please disregard this email.
          </div>
        </div>
      </div>
    `,
  });

  console.log(`🎉 OTP EMAIL SENT SUCCESSFULLY! Message ID: ${info.messageId}`);
}

main().catch((err) => {
  console.error('Error sending OTP:', err);
  process.exit(1);
});

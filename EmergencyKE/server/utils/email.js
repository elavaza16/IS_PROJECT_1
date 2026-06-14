const { BrevoClient } = require('@getbrevo/brevo');

exports.sendVerificationEmail = async (toEmail, token) => {
  try {
    const brevo = new BrevoClient({
      apiKey: process.env.BREVO_API_KEY,
    });

    const verifyUrl =
      `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    const response =
      await brevo.transactionalEmails.sendTransacEmail({
        sender: {
          name: 'EmergencyKE',
          email: 'noreply.emergencyke@gmail.com'
        },

        to: [
          {
            email: toEmail
          }
        ],

        subject: 'Verify your EmergencyKE account',

        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;">
            <h2 style="color:#C0392B;">EmergencyKE</h2>

            <p>
              Thank you for registering.
              Please verify your email address to activate your account.
            </p>

            <a href="${verifyUrl}"
               style="
                 display:inline-block;
                 margin:24px 0;
                 padding:12px 28px;
                 background:#C0392B;
                 color:#fff;
                 border-radius:8px;
                 text-decoration:none;
                 font-weight:bold;
               ">
              Verify Email Address
            </a>

            <p style="color:#888;font-size:12px;">
              This link expires in 24 hours.
            </p>

            <p style="color:#888;font-size:12px;">
              ${verifyUrl}
            </p>
          </div>
        `
      });

    console.log('✅ Email sent:', response);

    return response;

  } catch (error) {
    console.error('❌ Brevo email error');
    console.error(error);

    throw error;
  }
};


exports.sendPasswordResetEmail = async (toEmail, token) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from:    'EmergencyKE <onboarding@resend.dev>',
    to:      toEmail,
    subject: 'Reset your EmergencyKE password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;">
        <h2 style="color:#C0392B;">EmergencyKE</h2>
        <p>You requested a password reset. Click the button below to set a new password.</p>
        <a href="${resetUrl}"
          style="display:inline-block;margin:24px 0;padding:12px 28px;
                 background:#C0392B;color:#fff;border-radius:8px;
                 text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
        <p style="color:#888;font-size:12px;">
          This link expires in 1 hour. If you did not request this, ignore this email.
        </p>
        <p style="color:#888;font-size:12px;">
          If the button does not work, copy this link:<br/>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `,
  });
};
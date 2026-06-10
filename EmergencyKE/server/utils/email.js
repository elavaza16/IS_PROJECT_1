const Brevo = require('@getbrevo/brevo');

exports.sendVerificationEmail = async (toEmail, token) => {
  const client = Brevo.ApiClient.instance;
  client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

  const apiInstance = new Brevo.TransactionalEmailsApi();
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await apiInstance.sendTransacEmail({
    sender:      { name: 'EmergencyKE', email: 'emergencyke@gmail.com' },
    to:          [{ email: toEmail }],
    subject:     'Verify your EmergencyKE account',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;">
        <h2 style="color:#C0392B;">EmergencyKE</h2>
        <p>Thank you for registering. Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}"
          style="display:inline-block;margin:24px 0;padding:12px 28px;
                 background:#C0392B;color:#fff;border-radius:8px;
                 text-decoration:none;font-weight:bold;">
          Verify Email Address
        </a>
        <p style="color:#888;font-size:12px;">
          This link expires in 24 hours. If you did not create an account, ignore this email.
        </p>
        <p style="color:#888;font-size:12px;">
          If the button does not work, copy this link:<br/>
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
      </div>
    `,
  });
};
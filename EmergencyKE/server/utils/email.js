const Brevo = require('@getbrevo/brevo');

exports.sendVerificationEmail = async (toEmail, token) => {
  try {
    const apiInstance = new Brevo.TransactionalEmailsApi();

    // ✅ Correct modern authentication method
    apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    const response = await apiInstance.sendTransacEmail({
      // ✅ FIX: use Brevo default sender (NO domain required)
      sender: {
        name: 'EmergencyKE',
        email: 'no-reply@brevo.com'
      },

      to: [{ email: toEmail }],

      subject: 'Verify your EmergencyKE account',

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

    console.log("✅ Email sent successfully:", response);
    return response;

  } catch (error) {
    console.error("❌ Brevo email error:");
    console.error(error.response?.body || error);
    throw error;
  }
};
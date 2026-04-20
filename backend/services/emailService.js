const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"CryptoLegacy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your CryptoLegacy Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7fa; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7fa; padding-bottom: 40px; padding-top: 40px; }
          .container { max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 34px rgba(0, 0, 0, 0.05); }
          .header { padding: 40px 40px 20px; text-align: center; }
          .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #1a1d1f; text-decoration: none; }
          .content { padding: 0 40px 40px; text-align: center; }
          h1 { color: #1a1d1f; font-size: 24px; font-weight: 700; line-height: 32px; margin: 0 0 12px; letter-spacing: -0.5px; }
          p { color: #6f767e; font-size: 15px; line-height: 24px; margin: 0 0 24px; }
          .otp-card { background: #fcfdfe; border: 1px solid #edf2f7; border-radius: 20px; padding: 32px 20px; margin: 32px 0; position: relative; overflow: hidden; }
          .otp-card::before { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #3b82f6, #2563eb); }
          .otp-code { font-family: 'SF Mono', 'Roboto Mono', Menlo, monospace; font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #1a1d1f; margin-left: 12px; }
          .footer { padding: 0 40px 40px; text-align: center; }
          .footer-text { color: #9a9fa5; font-size: 12px; line-height: 20px; margin: 0; }
          .badge { display: inline-block; padding: 6px 12px; background: #ecf2ff; color: #3b82f6; border-radius: 100px; font-size: 12px; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div class="logo">CryptoLegacy</div>
            </div>
            <div class="content">
              <div class="badge">Security Layer</div>
              <h1>Verify your identity</h1>
              <p>To keep your account secure, please enter the following code in the verification screen.</p>
              <div class="otp-card">
                <div class="otp-code">${otp}</div>
              </div>
              <p style="font-size: 13px;">This code expires in 10 minutes. If you didn't request this, please secure your account immediately.</p>
            </div>
            <div class="footer">
              <p class="footer-text">© ${new Date().getFullYear()} CryptoLegacy Global Ltd.<br>Regulated digital asset management.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  await transporter.sendMail(mailOptions);
  console.log(`📧 OTP sent to ${email}: ${otp}`);
};

const sendWelcome = async (email, firstName) => {
  const mailOptions = {
    from: `"CryptoLegacy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to CryptoLegacy! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7fa; margin: 0; padding: 0; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7fa; padding: 40px 0; }
          .container { max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 34px rgba(0, 0, 0, 0.05); }
          .hero { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 60px 40px; text-align: center; color: #ffffff; }
          .logo-alt { font-size: 20px; font-weight: 800; color: #3b82f6; margin-bottom: 24px; display: block; }
          .content { padding: 40px; }
          h1 { color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -1px; }
          .benefit-item { padding: 20px; border-radius: 16px; background: #f8fafc; margin-bottom: 12px; border: 1px solid #f1f5f9; }
          .benefit-title { font-weight: 700; color: #1e293b; font-size: 15px; margin-bottom: 4px; display: block; }
          .benefit-desc { color: #64748b; font-size: 14px; line-height: 20px; }
          .cta-button { display: block; background: #3b82f6; color: #ffffff; text-align: center; padding: 18px; border-radius: 100px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 32px 0 0; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4); }
          .footer { padding: 0 40px 40px; text-align: center; }
          .footer-text { color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="hero">
              <span class="logo-alt">CryptoLegacy</span>
              <h1>Welcome, ${firstName}.</h1>
              <p style="color: #94a3b8; margin-top: 12px; font-size: 16px;">Your premium wealth journey begins today.</p>
            </div>
            <div class="content">
              <div class="benefit-item">
                <span class="benefit-title">Institutional Grade Security</span>
                <span class="benefit-desc">Your assets are protected by multi-sig cold storage and top-tier encryption.</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-title">High-Yield Returns</span>
                <span class="benefit-desc">Access exclusive investment tiers with competitive daily dividend payouts.</span>
              </div>
              <a href="#" class="cta-button">Enter Dashboard</a>
            </div>
            <div class="footer">
              <p class="footer-text">Need help? Contact our 24/7 priority concierge.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendBroadcast = async (email, subject, message) => {
  const mailOptions = {
    from: `"CryptoLegacy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7fa; margin: 0; padding: 0; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7fa; padding: 40px 0; }
          .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { padding: 32px 40px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
          .logo-text { font-weight: 800; font-size: 18px; color: #0f172a; }
          .update-tag { font-size: 10px; font-weight: 700; background: #f1f5f9; color: #64748b; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
          .content { padding: 40px; }
          .message-body { color: #334155; font-size: 16px; line-height: 1.6; }
          .highlight-box { border-left: 4px solid #3b82f6; background-color: #f8faff; padding: 24px; border-radius: 0 16px 16px 0; margin: 24px 0; }
          .footer { padding: 0 40px 40px; }
          .footer-text { color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 24px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <span class="logo-text">CryptoLegacy</span>
              <span class="update-tag">Official Update</span>
            </div>
            <div class="content">
              <div class="message-body">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">
                You are receiving this as a registered member of CryptoLegacy.<br>
                To manage notification preferences, visit your account settings.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP, sendWelcome, sendBroadcast };

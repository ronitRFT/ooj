const {
  getTransporter,
  getFromAddress,
  isEmailConfigured,
  resetTransporter,
} = require('../config/mail');
const { validateEmail } = require('../utils/emailValidator');

async function sendEmail({ to, subject, html, text, attachments = [] }) {
  const validation = validateEmail(to);
  if (!validation.valid) {
    return { sent: false, email: to, reason: validation.error };
  }

  if (!isEmailConfigured()) {
    const reason = 'SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env';
    return { sent: false, email: validation.email, skipped: true, reason };
  }

  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    const reason = 'Could not create email transporter';
    return { sent: false, email: validation.email, reason };
  }

  const mailOptions = {
    from: getFromAddress(),
    to: validation.email,
    subject,
    html,
    text,
    attachments,
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    return {
      sent: true,
      email: validation.email,
      messageId: info.messageId,
    };
  } catch (error) {
    resetTransporter();
    const reason = error.message || 'Unknown SMTP error';
    return {
      sent: false,
      email: validation.email,
      reason,
    };
  }
}

module.exports = { sendEmail };

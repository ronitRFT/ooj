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
    console.log(`Email failed: ${validation.error}`);
    return { sent: false, email: to, reason: validation.error };
  }

  if (!isEmailConfigured()) {
    const reason = 'SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env';
    console.log(`Email failed to ${validation.email}: ${reason}`);
    return { sent: false, email: validation.email, skipped: true, reason };
  }

  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    const reason = 'Could not create email transporter';
    console.log(`Email failed to ${validation.email}: ${reason}`);
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
    console.log(`Email sent successfully to ${validation.email} (messageId: ${info.messageId})`);
    return {
      sent: true,
      email: validation.email,
      messageId: info.messageId,
    };
  } catch (error) {
    resetTransporter();
    const reason = error.message || 'Unknown SMTP error';
    console.log(`Email failed to ${validation.email}: ${reason}`);
    return {
      sent: false,
      email: validation.email,
      reason,
    };
  }
}

module.exports = { sendEmail };

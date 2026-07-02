const { isEmailConfigured } = require('../config/mail');
const { sendEmail } = require('./mailService');
const {
  buildRegistrationInviteHtml,
  buildShareText,
} = require('../utils/emailTemplates');
const { validateEmails } = require('../utils/emailValidator');

function buildShareMessage(registrationUrl) {
  return `OOJ Foundation invites you to our event. Register here: ${registrationUrl}`;
}

async function sendRegistrationInviteEmail(to, event, registrationUrl) {
  if (!isEmailConfigured()) {
    return {
      sent: false,
      email: to,
      skipped: true,
      reason: 'SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env',
    };
  }

  const subject = event
    ? `Invitation: ${event.title} — OOJ Foundation`
    : 'OOJ Foundation Event Invitation';

  return sendEmail({
    to,
    subject,
    text: buildShareText(event, registrationUrl),
    html: buildRegistrationInviteHtml(event, registrationUrl),
  });
}

async function sendBulkRegistrationInvites(emails, event, registrationUrl) {
  const { valid, invalid } = validateEmails(emails);

  if (!valid.length) {
    return {
      sent: 0,
      failed: invalid.length,
      total: emails.length,
      results: invalid.map((item) => ({
        sent: false,
        email: item.email,
        reason: item.error,
      })),
    };
  }

  if (!isEmailConfigured()) {
    const reason = 'SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env';
    return {
      sent: 0,
      failed: valid.length + invalid.length,
      total: emails.length,
      skipped: true,
      reason,
      results: valid.map((email) => ({ sent: false, email, skipped: true, reason })),
    };
  }

  const results = [];

  for (const invalidItem of invalid) {
    results.push({
      sent: false,
      email: invalidItem.email,
      reason: invalidItem.error,
    });
  }

  for (const email of valid) {
    const result = await sendRegistrationInviteEmail(email, event, registrationUrl);
    results.push(result);
  }

  const sent = results.filter((r) => r.sent).length;
  const failed = results.filter((r) => !r.sent).length;

  return { sent, failed, total: emails.length, results };
}

module.exports = {
  buildShareMessage,
  sendRegistrationInviteEmail,
  sendBulkRegistrationInvites,
};

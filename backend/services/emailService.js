const path = require('path');
const fs = require('fs');
const { isEmailConfigured } = require('../config/mail');
const { sendEmail } = require('./mailService');
const { validateEmail } = require('../utils/emailValidator');
const { buildGuestInvitationHtml } = require('../utils/emailTemplates');

async function sendInvitationEmail(guest, event, invitation, qrCodePath) {
  const validation = validateEmail(guest.email);
  if (!validation.valid) {
    console.log(`Email failed for guest ${guest.uuid}: ${validation.error}`);
    return { sent: false, skipped: true, reason: validation.error };
  }

  if (!isEmailConfigured()) {
    const reason = 'SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env';
    console.log(`Email failed for guest ${guest.uuid}: ${reason}`);
    return { sent: false, skipped: true, reason };
  }

  const attachments = [];
  const qrFullPath = path.join(__dirname, '..', qrCodePath.replace(/^\//, ''));

  if (fs.existsSync(qrFullPath)) {
    attachments.push({
      filename: 'qr-code.png',
      path: qrFullPath,
      cid: 'qrcode',
    });
  }

  const pdfPath = invitation.pdfPath
    ? path.join(__dirname, '..', invitation.pdfPath.replace(/^\//, ''))
    : null;
  const htmlPath = invitation.htmlPath
    ? path.join(__dirname, '..', invitation.htmlPath.replace(/^\//, ''))
    : null;

  if (pdfPath && fs.existsSync(pdfPath)) {
    attachments.push({
      filename: `invitation-${guest.full_name.replace(/\s+/g, '-')}.pdf`,
      path: pdfPath,
    });
  } else if (htmlPath && fs.existsSync(htmlPath)) {
    attachments.push({
      filename: `invitation-${guest.full_name.replace(/\s+/g, '-')}.html`,
      path: htmlPath,
    });
  }

  const registrationUrl = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/register?event=active`
    : null;

  return sendEmail({
    to: guest.email,
    subject: `Your Invitation: ${event.title}`,
    html: buildGuestInvitationHtml(guest, event, registrationUrl),
    text: `Dear ${guest.full_name}, thank you for registering for ${event.title}. Your invitation is attached.`,
    attachments,
  });
}

module.exports = { sendInvitationEmail };

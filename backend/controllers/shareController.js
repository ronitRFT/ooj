const eventService = require('../services/eventService');
const { buildShareMessage, sendBulkRegistrationInvites } = require('../services/shareService');
const { validateEmail, validateEmails, EMAIL_REGEX } = require('../utils/emailValidator');

function parseRecipients(input) {
  if (!input || typeof input !== 'string') return [];

  return input
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseEmails(input) {
  const items = Array.isArray(input) ? input : parseRecipients(input);
  return validateEmails(items).valid;
}

function parsePhones(input) {
  const items = Array.isArray(input) ? input : parseRecipients(input);
  return [...new Set(
    items
      .filter((item) => !EMAIL_REGEX.test(item))
      .map((phone) => phone.replace(/[\s()-]/g, ''))
      .filter((phone) => /^\+?\d{7,15}$/.test(phone))
  )];
}

async function getShareInfo(req, res) {
  try {
    const info = await eventService.getRegistrationQrInfo();
    if (!info.event) {
      return res.status(404).json({ success: false, message: 'No active event found' });
    }

    res.json({
      success: true,
      data: {
        registration_url: info.registration_url,
        share_message: buildShareMessage(info.registration_url),
        event: {
          id: info.event.id,
          title: info.event.title,
          venue: info.event.venue,
          event_date: info.event.event_date,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function sendEmailInvite(req, res) {
  try {
    const { recipient_email, recipients, bulk_input } = req.body;

    let rawEmails = [];

    if (recipient_email) {
      rawEmails.push(recipient_email.trim());
    }
    if (Array.isArray(recipients)) {
      rawEmails.push(...recipients);
    }
    if (bulk_input) {
      rawEmails.push(...parseRecipients(bulk_input));
    }

    if (!rawEmails.length) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required',
      });
    }

    const { valid: emails, invalid } = validateEmails(rawEmails);

    if (recipient_email && !emails.length) {
      const check = validateEmail(recipient_email);
      return res.status(400).json({
        success: false,
        message: check.error || 'Invalid recipient email address',
      });
    }

    if (!emails.length) {
      return res.status(400).json({
        success: false,
        message: invalid[0]?.error || 'At least one valid email address is required',
      });
    }

    const info = await eventService.getRegistrationQrInfo();
    if (!info.event) {
      return res.status(404).json({ success: false, message: 'No active event found' });
    }

    const result = await sendBulkRegistrationInvites(
      rawEmails,
      info.event,
      info.registration_url
    );

    if (result.skipped) {
      return res.status(503).json({
        success: false,
        message: result.reason || 'Email service is not configured or unavailable',
      });
    }

    if (result.sent === 0) {
      const firstError = result.results.find((r) => r.reason)?.reason;
      return res.status(502).json({
        success: false,
        message: firstError || 'Failed to send email invitation',
        data: result,
      });
    }

    res.json({
      success: true,
      message: result.sent === emails.length
        ? `Invitation sent to ${result.sent} recipient${result.sent > 1 ? 's' : ''}`
        : `Sent ${result.sent} of ${emails.length} invitations`,
      data: result,
    });
  } catch (error) {
    console.log(`Email invite request failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send email invitation. Please try again later.',
    });
  }
}

module.exports = {
  getShareInfo,
  sendEmailInvite,
  parseEmails,
  parsePhones,
};

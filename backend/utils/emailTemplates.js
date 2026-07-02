function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatEventDate(eventDate) {
  if (!eventDate) return null;
  return new Date(eventDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildRegistrationInviteHtml(event, registrationUrl, recipientName) {
  const eventDate = formatEventDate(event?.event_date);
  const title = escapeHtml(event?.title || 'OOJ Foundation Event');
  const venue = escapeHtml(event?.venue || '');
  const url = escapeHtml(registrationUrl);
  const greeting = recipientName
    ? `<p style="font-size: 18px; color: #d4af37; margin: 0 0 20px;">Dear ${escapeHtml(recipientName)},</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f0eb;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#1a0a2e;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#2d1b4e,#1a0a2e);padding:32px 24px;text-align:center;border-bottom:3px solid #d4af37;">
              <p style="margin:0 0 8px;color:${event?.theme_secondary || '#d4af37'};font-size:12px;letter-spacing:4px;text-transform:uppercase;">You're Invited</p>
              ${event?.subtitle ? `<p style="margin:0 0 8px;color:#aaa;font-size:14px;font-style:italic;">${escapeHtml(event.subtitle)}</p>` : ''}
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:normal;line-height:1.3;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;text-align:center;">
              ${greeting}
              <p style="margin:0 0 24px;color:#cccccc;font-size:15px;line-height:1.7;">
                OOJ Foundation invites you to our event. Register below to receive your personal invitation QR code.
              </p>
              ${eventDate ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:12px;">
                <tr>
                  <td style="padding:12px 16px;background:rgba(255,255,255,0.05);border-radius:8px;text-align:left;">
                    <p style="margin:0 0 4px;color:#d4af37;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Date</p>
                    <p style="margin:0;color:#ffffff;font-size:15px;">${escapeHtml(eventDate)}</p>
                  </td>
                </tr>
              </table>` : ''}
              ${venue ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:12px 16px;background:rgba(255,255,255,0.05);border-radius:8px;text-align:left;">
                    <p style="margin:0 0 4px;color:#d4af37;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Venue</p>
                    <p style="margin:0;color:#ffffff;font-size:15px;">${venue}</p>
                  </td>
                </tr>
              </table>` : ''}
              <a href="${url}" style="display:inline-block;background:${event?.theme_secondary || '#d4af37'};color:${event?.theme_primary || '#1a0a2e'};padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;letter-spacing:0.5px;">
                Register Now
              </a>
              <p style="margin:28px 0 0;color:#888888;font-size:12px;line-height:1.6;word-break:break-all;">
                Or copy this link:<br><a href="${url}" style="color:#d4af37;">${url}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:16px;text-align:center;">
              <p style="margin:0;color:#666666;font-size:11px;">OOJ Foundation Event Management</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildGuestInvitationHtml(guest, event, registrationUrl) {
  const eventDate = formatEventDate(event?.event_date);
  const title = escapeHtml(event?.title || 'OOJ Foundation Event');
  const venue = escapeHtml(event?.venue || '');
  const name = escapeHtml(guest?.full_name || 'Guest');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f0eb;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#1a0a2e;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#2d1b4e,#1a0a2e);padding:32px 24px;text-align:center;border-bottom:3px solid #d4af37;">
              <p style="margin:0 0 8px;color:#d4af37;font-size:12px;letter-spacing:4px;text-transform:uppercase;">Registration Confirmed</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:normal;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;text-align:center;">
              <p style="font-size:18px;color:#d4af37;margin:0 0 20px;">Dear ${name},</p>
              <p style="margin:0 0 24px;color:#cccccc;font-size:15px;line-height:1.7;">
                Thank you for registering! Your invitation card and QR code are attached. Present your QR code at the entrance for check-in.
              </p>
              ${eventDate ? `<p style="margin:0 0 8px;color:#cccccc;font-size:15px;"><strong style="color:#ffffff;">Date:</strong> ${escapeHtml(eventDate)}</p>` : ''}
              ${venue ? `<p style="margin:0 0 24px;color:#cccccc;font-size:15px;"><strong style="color:#ffffff;">Venue:</strong> ${venue}</p>` : ''}
              ${registrationUrl ? `<a href="${escapeHtml(registrationUrl)}" style="display:inline-block;background:#d4af37;color:#1a0a2e;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">View Event</a>` : ''}
              <p style="margin:24px 0 0;color:#888888;font-size:12px;">Guest ID: ${escapeHtml(guest?.uuid || '')}</p>
            </td>
          </tr>
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:16px;text-align:center;">
              <p style="margin:0;color:#666666;font-size:11px;">OOJ Foundation Event Management</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildShareText(event, registrationUrl) {
  const lines = ['OOJ Foundation invites you to our event.'];
  if (event?.title) lines.push(`Event: ${event.title}`);
  if (event?.event_date) lines.push(`Date: ${formatEventDate(event.event_date)}`);
  if (event?.venue) lines.push(`Venue: ${event.venue}`);
  lines.push(`Register here: ${registrationUrl}`);
  return lines.join('\n');
}

module.exports = {
  buildRegistrationInviteHtml,
  buildGuestInvitationHtml,
  buildShareText,
  formatEventDate,
};

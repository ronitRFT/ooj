const path = require('path');
const fs = require('fs');
const { invitationsDir, assetsDir, fileToDataUri } = require('./paths');

const YOGI_JI_MESSAGE =
  'With the divine blessings of Yogi Ji, the OOJ Foundation warmly welcomes you to this sacred gathering. May this event bring peace, wisdom, and unity to all who attend.';

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatEventDate(eventDate) {
  return new Date(eventDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveBannerDataUri(event) {
  if (event.banner_image) {
    const bannerPath = path.join(__dirname, '..', event.banner_image.replace(/^\//, ''));
    if (fs.existsSync(bannerPath)) {
      const ext = path.extname(bannerPath).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/svg+xml';
      return fileToDataUri(bannerPath, mime);
    }
  }

  const defaultBanner = path.join(assetsDir, 'default-banner.svg');
  return fileToDataUri(defaultBanner, 'image/svg+xml');
}

function resolveLogoDataUri() {
  const logoPath = path.join(assetsDir, 'ooj-logo.svg');
  return fileToDataUri(logoPath, 'image/svg+xml');
}

function resolveQrDataUri(qrCodePath) {
  const qrFullPath = path.join(__dirname, '..', qrCodePath.replace(/^\//, ''));
  return fileToDataUri(qrFullPath, 'image/png');
}

function buildInvitationHtml(guest, event, qrCodePath) {
  const eventDate = formatEventDate(event.event_date);
  const logoUri = resolveLogoDataUri();
  const bannerUri = resolveBannerDataUri(event);
  const qrUri = resolveQrDataUri(qrCodePath);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invitation - ${escapeHtml(event.title)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #f8f4ef;
      color: #1a1a2e;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px;
    }
    .invitation {
      width: 100%;
      max-width: 680px;
      background: #ffffff;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      border: 2px solid #d4af37;
    }
    .banner {
      width: 100%;
      height: 180px;
      object-fit: cover;
      display: block;
    }
    .logo-section {
      text-align: center;
      padding: 24px 32px 16px;
      background: linear-gradient(180deg, #fff 0%, #faf8f5 100%);
      border-bottom: 1px solid #eee;
    }
    .logo {
      width: 90px;
      height: 90px;
      margin: 0 auto 8px;
      display: block;
    }
    .foundation-name {
      font-size: 13px;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #b8860b;
      font-weight: 600;
    }
    .invite-label {
      text-align: center;
      padding: 20px 32px 8px;
      font-size: 12px;
      letter-spacing: 5px;
      text-transform: uppercase;
      color: #888;
    }
    .guest-name {
      text-align: center;
      font-size: 32px;
      color: #1a0a2e;
      padding: 0 32px 8px;
      font-weight: normal;
      font-style: italic;
    }
    .honorific {
      text-align: center;
      font-size: 14px;
      color: #666;
      padding-bottom: 20px;
    }
    .event-title {
      text-align: center;
      font-size: 22px;
      color: #2d1b4e;
      padding: 16px 32px;
      background: linear-gradient(90deg, rgba(212,175,55,0.08) 0%, rgba(255,153,51,0.08) 50%, rgba(212,175,55,0.08) 100%);
      border-top: 1px solid #f0e6d3;
      border-bottom: 1px solid #f0e6d3;
    }
    .details {
      padding: 28px 48px;
      display: grid;
      gap: 18px;
    }
    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    .detail-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #d4af37, #f5e6a3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }
    .detail-content strong {
      display: block;
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #b8860b;
      margin-bottom: 4px;
    }
    .detail-content span {
      font-size: 15px;
      color: #333;
      line-height: 1.5;
    }
    .yogi-message {
      margin: 0 32px 28px;
      padding: 24px 28px;
      background: linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%);
      border-radius: 8px;
      border-left: 4px solid #d4af37;
      color: #f5e6a3;
      font-size: 14px;
      line-height: 1.8;
      font-style: italic;
      text-align: center;
    }
    .yogi-message .sign-off {
      display: block;
      margin-top: 12px;
      font-style: normal;
      font-size: 12px;
      letter-spacing: 2px;
      color: #d4af37;
      text-transform: uppercase;
    }
    .qr-section {
      text-align: center;
      padding: 24px 32px 32px;
      background: #faf8f5;
      border-top: 1px solid #f0e6d3;
    }
    .qr-section img {
      width: 140px;
      height: 140px;
      padding: 10px;
      background: #fff;
      border: 2px solid #d4af37;
      border-radius: 8px;
    }
    .qr-label {
      margin-top: 12px;
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #888;
    }
    .footer {
      text-align: center;
      padding: 16px;
      background: #1a0a2e;
      color: #888;
      font-size: 10px;
      letter-spacing: 1px;
    }
    .footer span { color: #d4af37; }
  </style>
</head>
<body>
  <div class="invitation">
    <img class="banner" src="${bannerUri}" alt="Event Banner" />
    <div class="logo-section">
      <img class="logo" src="${logoUri}" alt="OOJ Foundation Logo" />
      <p class="foundation-name">OOJ Foundation</p>
    </div>
    <p class="invite-label">You Are Cordially Invited</p>
    <h1 class="guest-name">${escapeHtml(guest.full_name)}</h1>
    <p class="honorific">We request the pleasure of your company at</p>
    <h2 class="event-title">${escapeHtml(event.title)}</h2>
    <div class="details">
      <div class="detail-row">
        <div class="detail-icon">📅</div>
        <div class="detail-content">
          <strong>Date &amp; Time</strong>
          <span>${escapeHtml(eventDate)}</span>
        </div>
      </div>
      <div class="detail-row">
        <div class="detail-icon">📍</div>
        <div class="detail-content">
          <strong>Venue</strong>
          <span>${escapeHtml(event.venue)}</span>
        </div>
      </div>
      ${guest.organization ? `
      <div class="detail-row">
        <div class="detail-icon">🏛</div>
        <div class="detail-content">
          <strong>Organization</strong>
          <span>${escapeHtml(guest.organization)}</span>
        </div>
      </div>` : ''}
    </div>
    <blockquote class="yogi-message">
      "${escapeHtml(YOGI_JI_MESSAGE)}"
      <span class="sign-off">— With Blessings, Yogi Ji</span>
    </blockquote>
    <div class="qr-section">
      <img src="${qrUri}" alt="Check-in QR Code" />
      <p class="qr-label">Present this QR code at the entrance</p>
    </div>
    <div class="footer">
      <span>OOJ Foundation</span> &bull; Event Management &bull; ${escapeHtml(guest.uuid)}
    </div>
  </div>
</body>
</html>`;
}

async function generateInvitationCard(guest, event, qrCodePath) {
  const htmlFileName = `invitation-${guest.uuid}.html`;
  const htmlFilePath = path.join(invitationsDir, htmlFileName);
  const html = buildInvitationHtml(guest, event, qrCodePath);

  fs.writeFileSync(htmlFilePath, html, 'utf8');

  return {
    htmlPath: `/uploads/invitations/${htmlFileName}`,
    htmlFilePath,
  };
}

module.exports = {
  buildInvitationHtml,
  generateInvitationCard,
  YOGI_JI_MESSAGE,
};

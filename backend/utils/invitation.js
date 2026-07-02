const path = require('path');
const fs = require('fs');
const { invitationsDir, assetsDir, fileToDataUri, getMimeType } = require('./paths');
const {
  resolveEventTheme,
  resolveInvitationText,
  resolveYogiName,
  resolveHostName,
} = require('./eventTheme');

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncateText(text, maxLen = 160) {
  if (!text) return '';
  const trimmed = String(text).trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen).trim()}…`;
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

function resolveImageDataUri(imagePath, fallbackPath) {
  if (imagePath) {
    const fullPath = path.join(__dirname, '..', imagePath.replace(/^\//, ''));
    if (fs.existsSync(fullPath)) {
      return fileToDataUri(fullPath, getMimeType(fullPath));
    }
  }
  if (fallbackPath && fs.existsSync(fallbackPath)) {
    return fileToDataUri(fallbackPath, getMimeType(fallbackPath));
  }
  return null;
}

function resolveBannerDataUri(event) {
  return resolveImageDataUri(
    event?.banner_image,
    path.join(assetsDir, 'default-banner.svg')
  );
}

function resolveLogoDataUri(event) {
  return resolveImageDataUri(
    event?.logo_image,
    path.join(assetsDir, 'ooj-logo.svg')
  );
}

function resolveQrDataUri(qrCodePath) {
  if (!qrCodePath) return null;
  const qrFullPath = path.join(__dirname, '..', qrCodePath.replace(/^\//, ''));
  if (!fs.existsSync(qrFullPath)) return null;
  return fileToDataUri(qrFullPath, 'image/png');
}

function buildInvitationHtml(guest, event, qrCodePath) {
  const eventDate = formatEventDate(event.event_date);
  const logoUri = resolveLogoDataUri(event);
  const bannerUri = resolveBannerDataUri(event);
  const qrUri = resolveQrDataUri(qrCodePath);
  const yogiMessage = truncateText(resolveInvitationText(event), 150);
  const yogiName = resolveYogiName(event);
  const theme = resolveEventTheme(event);
  const primary = theme.primary;
  const secondary = theme.secondary;
  const accent = theme.accent;
  const hostName = resolveHostName(event);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invitation - ${escapeHtml(event.title)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    html, body {
      width: 210mm;
      height: 297mm;
      overflow: hidden;
    }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: #faf7f2;
      color: ${primary};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .invitation {
      width: 210mm;
      height: 297mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #fff;
      border: 2px solid ${secondary};
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .banner {
      width: 100%;
      height: 48mm;
      object-fit: cover;
      display: block;
      flex-shrink: 0;
    }

    .banner-placeholder {
      height: 48mm;
      flex-shrink: 0;
      background: linear-gradient(135deg, ${accent} 0%, ${secondary}33 100%);
    }

    .header {
      display: flex;
      align-items: center;
      gap: 4mm;
      padding: 3mm 6mm;
      border-bottom: 1px solid ${secondary}44;
      flex-shrink: 0;
    }

    .logo {
      width: 14mm;
      height: 14mm;
      object-fit: contain;
      flex-shrink: 0;
    }

    .header-text {
      flex: 1;
      min-width: 0;
    }

    .foundation-name {
      font-size: 8pt;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${secondary};
      font-weight: 600;
    }

    .subtitle {
      font-size: 7.5pt;
      color: #666;
      font-style: italic;
      margin-top: 1mm;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .main {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 4mm 6mm 3mm;
      gap: 3mm;
    }

    .invite-block {
      text-align: center;
      flex-shrink: 0;
    }

    .invite-label {
      font-size: 7pt;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #888;
    }

    .guest-name {
      font-size: 16pt;
      color: ${primary};
      font-weight: normal;
      font-style: italic;
      line-height: 1.15;
      margin: 1mm 0;
      max-height: 12mm;
      overflow: hidden;
    }

    .honorific {
      font-size: 8pt;
      color: #666;
    }

    .event-title {
      font-size: 12pt;
      color: ${primary};
      padding: 2mm 3mm;
      margin-top: 1.5mm;
      background: linear-gradient(90deg, ${secondary}18 0%, ${accent}55 50%, ${secondary}18 100%);
      border-top: 1px solid ${secondary}33;
      border-bottom: 1px solid ${secondary}33;
      line-height: 1.2;
      max-height: 14mm;
      overflow: hidden;
    }

    .host-line {
      font-size: 7.5pt;
      color: #666;
      margin-top: 1mm;
    }

    .details {
      display: grid;
      gap: 2.5mm;
      flex-shrink: 0;
    }

    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 3mm;
    }

    .detail-icon {
      width: 7mm;
      height: 7mm;
      background: ${secondary};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
      flex-shrink: 0;
    }

    .detail-content strong {
      display: block;
      font-size: 6.5pt;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${secondary};
      margin-bottom: 0.5mm;
    }

    .detail-content span {
      font-size: 8.5pt;
      color: #333;
      line-height: 1.35;
    }

    .yogi-message {
      flex: 1;
      min-height: 0;
      max-height: 38mm;
      padding: 2.5mm 3mm;
      background: linear-gradient(135deg, ${primary} 0%, ${primary}ee 100%);
      border-left: 3px solid ${secondary};
      color: #fff;
      font-size: 8pt;
      line-height: 1.45;
      font-style: italic;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
    }

    .yogi-message .sign-off {
      display: block;
      margin-top: 2mm;
      font-style: normal;
      font-size: 6.5pt;
      letter-spacing: 0.1em;
      color: ${secondary};
      text-transform: uppercase;
    }

    .bottom-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4mm;
      padding: 3mm 6mm 4mm;
      border-top: 1px solid ${secondary}33;
      background: #faf8f5;
      flex-shrink: 0;
    }

    .qr-section {
      text-align: center;
      flex-shrink: 0;
    }

    .qr-section img {
      width: 26mm;
      height: 26mm;
      padding: 1.5mm;
      background: #fff;
      border: 1.5px solid ${secondary};
      border-radius: 2mm;
      display: block;
    }

    .qr-label {
      margin-top: 1.5mm;
      font-size: 6pt;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #888;
      max-width: 32mm;
      line-height: 1.3;
    }

    .footer-meta {
      flex: 1;
      font-size: 6.5pt;
      color: #666;
      line-height: 1.45;
    }

    .footer-meta strong {
      display: block;
      color: ${primary};
      font-size: 7pt;
      margin-bottom: 1mm;
    }

    .footer-id {
      font-size: 5.5pt;
      color: #999;
      margin-top: 1mm;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="invitation">
    ${bannerUri
      ? `<img class="banner" src="${bannerUri}" alt="Event Banner" />`
      : '<div class="banner-placeholder"></div>'}

    <div class="header">
      ${logoUri ? `<img class="logo" src="${logoUri}" alt="Logo" />` : ''}
      <div class="header-text">
        <p class="foundation-name">${escapeHtml(hostName)}</p>
        ${event.subtitle ? `<p class="subtitle">${escapeHtml(event.subtitle)}</p>` : ''}
      </div>
    </div>

    <div class="main">
      <div class="invite-block">
        <p class="invite-label">You Are Cordially Invited</p>
        <h1 class="guest-name">${escapeHtml(guest.full_name)}</h1>
        <p class="honorific">We request the pleasure of your company at</p>
        <h2 class="event-title">${escapeHtml(event.title)}</h2>
        ${event.host_name ? `<p class="host-line">Hosted by ${escapeHtml(event.host_name)}</p>` : ''}
      </div>

      <div class="details">
        <div class="detail-row">
          <div class="detail-icon">📅</div>
          <div class="detail-content"><strong>Date &amp; Time</strong><span>${escapeHtml(eventDate)}</span></div>
        </div>
        <div class="detail-row">
          <div class="detail-icon">📍</div>
          <div class="detail-content"><strong>Venue</strong><span>${escapeHtml(event.venue)}</span></div>
        </div>
        ${event.rsvp_contact ? `<div class="detail-row"><div class="detail-icon">📞</div><div class="detail-content"><strong>RSVP</strong><span>${escapeHtml(event.rsvp_contact)}</span></div></div>` : ''}
        ${guest.organization ? `<div class="detail-row"><div class="detail-icon">🏛</div><div class="detail-content"><strong>Organization</strong><span>${escapeHtml(guest.organization)}</span></div></div>` : ''}
      </div>

      <blockquote class="yogi-message">
        "${escapeHtml(yogiMessage)}"
        <span class="sign-off">— With Blessings, ${escapeHtml(yogiName)}</span>
      </blockquote>
    </div>

    <div class="bottom-row">
      <div class="footer-meta">
        <strong>${escapeHtml(hostName)}</strong>
        Present this invitation at the venue entrance for check-in.
        <div class="footer-id">Guest ID: ${escapeHtml(guest.uuid)}</div>
      </div>
      <div class="qr-section">
        ${qrUri
    ? `<img src="${qrUri}" alt="Check-in QR Code" />`
    : '<div style="width:26mm;height:26mm;border:1.5px dashed #ccc;border-radius:2mm;"></div>'}
        <p class="qr-label">Scan for check-in</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function generateInvitationCard(guest, event, qrCodePath) {
  const htmlFileName = `invitation-${guest.uuid}.html`;
  const htmlFilePath = path.join(invitationsDir, htmlFileName);
  fs.writeFileSync(htmlFilePath, buildInvitationHtml(guest, event, qrCodePath), 'utf8');
  return { htmlPath: `/uploads/invitations/${htmlFileName}`, htmlFilePath };
}

module.exports = { buildInvitationHtml, generateInvitationCard };

const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { qrDir } = require('./paths');

const EVENT_QR_FILENAME = 'event-registration.png';

function getRegistrationUrl() {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${frontendUrl}/register?event=active`;
}

function getEventQrFilePath() {
  return path.join(qrDir, EVENT_QR_FILENAME);
}

function getEventQrPublicPath() {
  return `/uploads/qr/${EVENT_QR_FILENAME}`;
}

async function generateEventRegistrationQr() {
  const registrationUrl = getRegistrationUrl();
  const filePath = getEventQrFilePath();

  await QRCode.toFile(filePath, registrationUrl, {
    width: 512,
    margin: 2,
    color: { dark: '#1a0a2e', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });

  return {
    qrPath: getEventQrPublicPath(),
    registrationUrl,
  };
}

async function ensureEventRegistrationQr() {
  const filePath = getEventQrFilePath();
  const registrationUrl = getRegistrationUrl();

  if (fs.existsSync(filePath)) {
    return {
      qrPath: getEventQrPublicPath(),
      registrationUrl,
    };
  }

  return generateEventRegistrationQr();
}

module.exports = {
  generateEventRegistrationQr,
  ensureEventRegistrationQr,
  getRegistrationUrl,
  getEventQrPublicPath,
};

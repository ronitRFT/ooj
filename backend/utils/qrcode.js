const QRCode = require('qrcode');
const path = require('path');
const { qrDir } = require('./paths');

async function generateQRCode(guestUuid, guestName) {
  const qrData = JSON.stringify({
    uuid: guestUuid,
    name: guestName,
    type: 'ooj-event-guest',
  });

  const fileName = `${guestUuid}.png`;
  const filePath = path.join(qrDir, fileName);

  await QRCode.toFile(filePath, qrData, {
    width: 300,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });

  return `/uploads/qr/${fileName}`;
}

module.exports = { generateQRCode };

const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const qrDir = path.join(uploadsDir, 'qr');
const invitationsDir = path.join(uploadsDir, 'invitations');
const assetsDir = path.join(__dirname, '..', 'assets');

function ensureUploadDirs() {
  [uploadsDir, qrDir, invitationsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function fileToDataUri(filePath, mimeType) {
  const buffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

module.exports = {
  uploadsDir,
  qrDir,
  invitationsDir,
  assetsDir,
  ensureUploadDirs,
  fileToDataUri,
};

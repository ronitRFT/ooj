const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const qrDir = path.join(uploadsDir, 'qr');
const invitationsDir = path.join(uploadsDir, 'invitations');
const bannersDir = path.join(uploadsDir, 'banners');
const logosDir = path.join(uploadsDir, 'logos');
const assetsDir = path.join(__dirname, '..', 'assets');

function ensureUploadDirs() {
  [uploadsDir, qrDir, invitationsDir, bannersDir, logosDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function fileToDataUri(filePath, mimeType) {
  const buffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.pdf') return 'application/pdf';
  return 'application/octet-stream';
}

module.exports = {
  uploadsDir,
  qrDir,
  invitationsDir,
  bannersDir,
  logosDir,
  assetsDir,
  ensureUploadDirs,
  fileToDataUri,
  getMimeType,
};

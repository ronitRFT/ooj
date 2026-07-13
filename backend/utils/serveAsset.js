const path = require('path');
const fs = require('fs');
const { uploadsDir } = require('./paths');
const { getMimeType } = require('./paths');

function resolveUploadFile(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') {
    return null;
  }

  const normalized = relativePath.replace(/^\//, '');
  if (normalized.includes('..')) {
    return null;
  }

  const fullPath = path.join(uploadsDir, normalized.replace(/^uploads\//, ''));
  const resolved = path.resolve(fullPath);
  const uploadsRoot = path.resolve(uploadsDir);

  if (!resolved.startsWith(uploadsRoot) || !fs.existsSync(resolved)) {
    return null;
  }

  return resolved;
}

function sendUploadFile(res, relativePath, { downloadName, inline = true } = {}) {
  const filePath = resolveUploadFile(relativePath);
  if (!filePath) {
    return false;
  }

  const mimeType = getMimeType(filePath);
  res.setHeader('Content-Type', mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, max-age=300');

  if (downloadName) {
    const disposition = inline ? 'inline' : 'attachment';
    const safeName = downloadName.replace(/[^\w.\-]/g, '_');
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`);
  }

  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Disposition, Content-Length');

  res.sendFile(filePath);
  return true;
}

module.exports = {
  resolveUploadFile,
  sendUploadFile,
};

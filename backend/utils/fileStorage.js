const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { uploadsDir, bannersDir, logosDir } = require('./paths');

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const EXTENSION_TO_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function normalizeExtension(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.has(ext) ? ext : null;
}

function isAllowedImageUpload(originalName, mimeType) {
  const ext = normalizeExtension(originalName);
  if (!ext) {
    return { valid: false, error: 'Only jpg, jpeg, png, and webp images are allowed' };
  }

  const normalizedMime = String(mimeType || '').toLowerCase().split(';')[0].trim();
  const expectedMime = EXTENSION_TO_MIME[ext];
  if (!ALLOWED_IMAGE_MIMES.has(normalizedMime) || normalizedMime !== expectedMime) {
    return { valid: false, error: 'Invalid image mime type' };
  }

  return { valid: true, extension: ext };
}

function sanitizeUploadFilename(originalName, prefix) {
  const ext = normalizeExtension(originalName) || '.jpg';
  const safePrefix = String(prefix || 'file').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 20) || 'file';
  return `${safePrefix}-${uuidv4()}${ext}`;
}

function resolveUploadPath(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return null;
  if (relativePath.includes('..')) return null;

  const normalized = relativePath.replace(/^\//, '').replace(/^uploads\/?/, '');
  const fullPath = path.resolve(uploadsDir, normalized);
  const uploadsRoot = path.resolve(uploadsDir);

  if (!fullPath.startsWith(`${uploadsRoot}${path.sep}`) && fullPath !== uploadsRoot) {
    return null;
  }

  return fullPath;
}

function deleteUploadFile(relativePath) {
  const fullPath = resolveUploadPath(relativePath);
  if (!fullPath) return false;

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
  } catch (error) {
    console.warn(`[storage] Failed to delete file ${relativePath}:`, error.message);
  }

  return false;
}

function deleteEventImageFiles(event) {
  if (!event) return;
  if (event.banner_image) deleteUploadFile(event.banner_image);
  if (event.logo_image) deleteUploadFile(event.logo_image);
}

function deleteGuestAssetFiles(guest) {
  if (!guest) return;
  if (guest.qr_code_path) deleteUploadFile(guest.qr_code_path);
  if (guest.invitation_path) deleteUploadFile(guest.invitation_path);
  if (guest.invitation_pdf_path) deleteUploadFile(guest.invitation_pdf_path);
}

function copyUploadFile(relativePath, destDir, prefix) {
  if (!relativePath) return null;

  const sourcePath = resolveUploadPath(relativePath);
  if (!sourcePath || !fs.existsSync(sourcePath)) return null;

  const ext = path.extname(sourcePath).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) return null;

  const filename = sanitizeUploadFilename(`copy${ext}`, prefix);
  const destPath = path.join(destDir, filename);

  if (!destPath.startsWith(path.resolve(destDir))) {
    return null;
  }

  fs.copyFileSync(sourcePath, destPath);

  const folderName = path.basename(destDir);
  return `/uploads/${folderName}/${filename}`;
}

function copyEventImageFiles(event) {
  return {
    banner_image: copyUploadFile(event.banner_image, bannersDir, 'banner'),
    logo_image: copyUploadFile(event.logo_image, logosDir, 'logo'),
  };
}

module.exports = {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIMES,
  MAX_UPLOAD_BYTES,
  isAllowedImageUpload,
  sanitizeUploadFilename,
  resolveUploadPath,
  deleteUploadFile,
  deleteEventImageFiles,
  deleteGuestAssetFiles,
  copyUploadFile,
  copyEventImageFiles,
};

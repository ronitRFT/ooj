export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function getExtension(fileName) {
  const match = String(fileName || '').toLowerCase().match(/(\.[a-z0-9]+)$/);
  return match ? match[1] : '';
}

export function validateImageUploadFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { valid: false, error: 'File too large. Max 5MB.' };
  }

  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: 'Only jpg, jpeg, png, and webp images are allowed' };
  }

  const mime = String(file.type || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return { valid: false, error: 'Invalid image file type' };
  }

  return { valid: true };
}

const MIN_PHONE_LENGTH = 10;
const MAX_PHONE_LENGTH = 15;

function stripPhoneInput(phone) {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/[\s\-+().]/g, '').replace(/\D/g, '');
}

function validatePhone(phone, { required = false } = {}) {
  if (!phone || !String(phone).trim()) {
    if (required) {
      return { valid: false, error: 'Phone number is required' };
    }
    return { valid: true, phone: null };
  }

  const raw = String(phone).trim();
  if (/[a-zA-Z]/.test(raw)) {
    return { valid: false, error: 'Phone number must contain digits only' };
  }

  const digits = stripPhoneInput(raw);

  if (!digits) {
    return { valid: false, error: 'Phone number must contain digits only' };
  }

  if (!/^\d+$/.test(digits)) {
    return { valid: false, error: 'Phone number must contain digits only' };
  }

  if (digits.length < MIN_PHONE_LENGTH || digits.length > MAX_PHONE_LENGTH) {
    return {
      valid: false,
      error: `Phone number must be ${MIN_PHONE_LENGTH}–${MAX_PHONE_LENGTH} digits`,
    };
  }

  return { valid: true, phone: digits };
}

function validateWhatsAppPhone(phone) {
  const raw = String(phone || '').trim();
  if (!raw) {
    return { valid: false, error: 'WhatsApp number is required' };
  }

  if (/[a-zA-Z]/.test(raw)) {
    return { valid: false, error: 'Phone number must contain digits only' };
  }

  let digits = stripPhoneInput(raw);

  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  if (digits.length < 11 || digits.length > 15) {
    return {
      valid: false,
      error: 'Include country code (e.g. +91 9876543210)',
    };
  }

  if (!/^[1-9]\d{10,14}$/.test(digits)) {
    return { valid: false, error: 'Invalid international phone number' };
  }

  return { valid: true, phone: digits };
}

/** Last 10 digits for duplicate matching in guest registration */
function normalizePhoneForStorage(phone) {
  const result = validatePhone(phone);
  if (!result.valid || !result.phone) return null;
  return result.phone.length >= 10 ? result.phone.slice(-10) : result.phone;
}

module.exports = {
  stripPhoneInput,
  validatePhone,
  validateWhatsAppPhone,
  normalizePhoneForStorage,
  MIN_PHONE_LENGTH,
  MAX_PHONE_LENGTH,
};

const EMAIL_REGEX = /^[^\s@]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required' };
  }

  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, error: 'Email address is required' };
  }

  if (!trimmed.includes('@')) {
    return { valid: false, error: 'Enter a valid email address (e.g. name@example.com)' };
  }

  if (trimmed.startsWith('@') || trimmed.endsWith('@')) {
    return { valid: false, error: 'Enter a complete email address' };
  }

  const [localPart, domainPart] = trimmed.split('@');
  if (!localPart || !domainPart || !domainPart.includes('.')) {
    return { valid: false, error: 'Enter a complete email address' };
  }

  const tld = domainPart.split('.').pop();
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return { valid: false, error: 'Enter a valid email domain' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Enter a valid email address' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email address is too long' };
  }

  return { valid: true, email: trimmed };
}

const MIN_PHONE_LENGTH = 10;
const MAX_PHONE_LENGTH = 15;

export function stripPhoneInput(phone) {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/[\s\-+().]/g, '').replace(/\D/g, '');
}

export function validatePhone(phone, { required = false } = {}) {
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

  if (!digits || !/^\d+$/.test(digits)) {
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

export function validateRegistrationForm({ full_name, email, phone, organization }) {
  const errors = {};

  if (!full_name || !full_name.trim()) {
    errors.full_name = 'Full name is required';
  }

  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    errors.email = emailResult.error;
  }

  if (phone && String(phone).trim()) {
    const phoneResult = validatePhone(phone);
    if (!phoneResult.valid) {
      errors.phone = phoneResult.error;
    }
  }

  if (organization && String(organization).trim().length > 255) {
    errors.organization = 'Organization must be 255 characters or less';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized: {
      full_name: full_name?.trim() || '',
      email: emailResult.valid ? emailResult.email : '',
      phone: (() => {
        if (!phone || !String(phone).trim()) return null;
        const phoneResult = validatePhone(phone);
        return phoneResult.valid ? phoneResult.phone : null;
      })(),
    },
  };
}

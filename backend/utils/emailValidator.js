const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required' };
  }

  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, error: 'Email address is required' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: `Invalid email address: ${email}` };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email address is too long' };
  }

  return { valid: true, email: trimmed };
}

function validateEmails(emails) {
  const valid = [];
  const invalid = [];

  for (const email of emails) {
    const result = validateEmail(email);
    if (result.valid) {
      valid.push(result.email);
    } else {
      invalid.push({ email, error: result.error });
    }
  }

  return {
    valid: [...new Set(valid)],
    invalid,
  };
}

module.exports = { validateEmail, validateEmails, EMAIL_REGEX };

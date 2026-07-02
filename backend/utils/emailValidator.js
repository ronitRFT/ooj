const EMAIL_REGEX = /^[^\s@]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(email) {
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
    return { valid: false, error: `Invalid email address: ${email.trim()}` };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email address is too long' };
  }

  return { valid: true, email: trimmed };
}

function validateEmails(emails) {
  const valid = [];
  const invalid = [];
  const seen = new Set();

  for (const email of emails) {
    const result = validateEmail(email);
    if (result.valid) {
      if (!seen.has(result.email)) {
        seen.add(result.email);
        valid.push(result.email);
      }
    } else {
      invalid.push({ email: String(email).trim(), error: result.error });
    }
  }

  return { valid, invalid };
}

module.exports = { validateEmail, validateEmails, EMAIL_REGEX };

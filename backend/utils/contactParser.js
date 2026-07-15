const { validateEmail, EMAIL_REGEX } = require('./emailValidator');
const { validatePhone } = require('./phoneValidator');

function parseRecipients(input) {
  if (!input || typeof input !== 'string') return [];
  return input
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function looksLikeEmail(value) {
  return value.includes('@') || EMAIL_REGEX.test(value);
}

function parseBulkContacts(input) {
  const items = parseRecipients(input);
  const validEmails = [];
  const validPhones = [];
  const invalid = [];
  const seenEmails = new Set();
  const seenPhones = new Set();
  let skippedDuplicates = 0;

  for (const item of items) {
    if (looksLikeEmail(item)) {
      const result = validateEmail(item);
      if (result.valid) {
        if (seenEmails.has(result.email)) {
          skippedDuplicates += 1;
        } else {
          seenEmails.add(result.email);
          validEmails.push(result.email);
        }
      } else {
        invalid.push({ value: item, type: 'email', error: result.error });
      }
    } else {
      const result = validatePhone(item);
      if (result.valid) {
        if (seenPhones.has(result.phone)) {
          skippedDuplicates += 1;
        } else {
          seenPhones.add(result.phone);
          validPhones.push(result.phone);
        }
      } else {
        invalid.push({ value: item, type: 'phone', error: result.error });
      }
    }
  }

  return {
    validEmails,
    validPhones,
    invalid,
    skippedDuplicates,
    total: items.length,
  };
}

module.exports = { parseRecipients, parseBulkContacts, looksLikeEmail };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseGuestUuid(qrText) {
  if (!qrText || typeof qrText !== 'string') {
    return null;
  }

  const trimmed = qrText.trim();

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed?.uuid && UUID_REGEX.test(parsed.uuid)) {
      return parsed.uuid;
    }
  } catch {
    // Not JSON
  }

  if (UUID_REGEX.test(trimmed)) {
    return trimmed;
  }

  return null;
}

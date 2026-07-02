function extractUuid(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && parsed.uuid) {
      return String(parsed.uuid).trim();
    }
  } catch {
    // Not JSON — treat as raw UUID below
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function extractUuidFromRequest(body = {}) {
  if (body.uuid) {
    return extractUuid(body.uuid);
  }

  if (body.qrData) {
    return extractUuid(body.qrData);
  }

  return null;
}

module.exports = { extractUuid, extractUuidFromRequest };

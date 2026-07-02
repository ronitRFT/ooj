const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

const CLEARABLE_OPTIONAL_FIELDS = new Set([
  'subtitle',
  'about_yogi',
  'about_foundation',
  'invitation_text',
  'rsvp_contact',
]);

const THEME_COLOR_FIELDS = ['theme_primary', 'theme_secondary', 'theme_accent'];

function isValidHexColor(value) {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value.trim());
}

function validateThemeColors(data) {
  THEME_COLOR_FIELDS.forEach((field) => {
    if (data[field] === undefined || data[field] === null || data[field] === '') return;
    if (!isValidHexColor(data[field])) {
      throw new Error(`${field} must be a valid hex color (e.g. #D97706)`);
    }
    data[field] = data[field].trim();
  });
}

function applyClearableOptionalFields(data, body) {
  CLEARABLE_OPTIONAL_FIELDS.forEach((field) => {
    if (body[field] !== undefined) {
      data[field] = body[field] === '' ? null : body[field];
    }
  });
}

module.exports = {
  CLEARABLE_OPTIONAL_FIELDS,
  THEME_COLOR_FIELDS,
  isValidHexColor,
  validateThemeColors,
  applyClearableOptionalFields,
};

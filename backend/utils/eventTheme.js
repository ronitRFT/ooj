const DEFAULT_THEME = {
  theme_primary: '#D97706',
  theme_secondary: '#C8A951',
  theme_accent: '#EADBC8',
};

const DEFAULT_COPY = {
  host_name: 'OOJ Foundation',
  yogi_name: 'Guest of Honor',
  invitation_text:
    'With divine blessings, we warmly welcome you to this sacred gathering. May this event bring peace, wisdom, and unity to all who attend.',
  about_yogi:
    'A revered spiritual guide whose teachings illuminate the path of devotion, self-realization, and compassionate living.',
  about_foundation:
    'Dedicated to preserving and sharing the timeless wisdom of yogic traditions through sacred gatherings and community service.',
};

function resolveEventTheme(event) {
  return {
    primary: event?.theme_primary || DEFAULT_THEME.theme_primary,
    secondary: event?.theme_secondary || DEFAULT_THEME.theme_secondary,
    accent: event?.theme_accent || DEFAULT_THEME.theme_accent,
  };
}

function resolveInvitationText(event) {
  return event?.invitation_text || DEFAULT_COPY.invitation_text;
}

function resolveYogiName(event) {
  return event?.yogi_name || DEFAULT_COPY.yogi_name;
}

function resolveHostName(event) {
  return event?.host_name || DEFAULT_COPY.host_name;
}

module.exports = {
  DEFAULT_THEME,
  DEFAULT_COPY,
  resolveEventTheme,
  resolveInvitationText,
  resolveYogiName,
  resolveHostName,
};

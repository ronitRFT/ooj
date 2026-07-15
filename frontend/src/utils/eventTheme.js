import { getUploadUrl } from '../services/api';

/** Fallbacks when CMS fields are empty */
export const DEFAULT_THEME = {
  theme_primary: '#FF1A24',
  theme_secondary: '#D70F18',
  theme_accent: '#F4F4F4',
};

export const DEFAULT_COPY = {
  host_name: 'OOJ Foundation',
  brand_tagline: 'Events & Gatherings',
  yogi_name: 'Guest of Honor',
  about_foundation:
    'OOJ Foundation is dedicated to preserving and sharing the timeless wisdom of yogic traditions. Through sacred gatherings, spiritual discourse, and community service, we create spaces where seekers can deepen their practice and connect with divine consciousness.',
  about_yogi:
    'A revered spiritual guide whose teachings illuminate the path of devotion, self-realization, and compassionate living. Their presence graces this gathering with wisdom, blessings, and profound spiritual energy.',
  invitation_text:
    'With divine blessings, we warmly welcome you to this sacred gathering. May this event bring peace, wisdom, and unity to all who attend.',
  rsvp_description:
    'Register online to receive your personal invitation and QR code for seamless check-in at the venue.',
};

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '');
  if (normalized.length !== 6) return { r: 217, g: 119, b: 6 };
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function darkenHex(hex, amount = 0.12) {
  const { r, g, b } = hexToRgb(hex);
  return `#${[r * (1 - amount), g * (1 - amount), b * (1 - amount)]
    .map((c) => clampChannel(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function resolveEventTheme(event) {
  return {
    primary: event?.theme_primary || DEFAULT_THEME.theme_primary,
    secondary: event?.theme_secondary || DEFAULT_THEME.theme_secondary,
    accent: event?.theme_accent || DEFAULT_THEME.theme_accent,
  };
}

export function resolveEventCopy(event) {
  return {
    title: event?.title || DEFAULT_COPY.host_name,
    subtitle: event?.subtitle || '',
    description: event?.description || '',
    host_name: event?.host_name || DEFAULT_COPY.host_name,
    yogi_name: event?.yogi_name || DEFAULT_COPY.yogi_name,
    about_foundation: event?.about_foundation || DEFAULT_COPY.about_foundation,
    about_yogi: event?.about_yogi || DEFAULT_COPY.about_yogi,
    invitation_text: event?.invitation_text || DEFAULT_COPY.invitation_text,
    rsvp_contact: event?.rsvp_contact || '',
    rsvp_description: DEFAULT_COPY.rsvp_description,
    brand_name: event?.host_name || DEFAULT_COPY.host_name,
    brand_tagline: event?.subtitle || DEFAULT_COPY.brand_tagline,
  };
}

export function resolveEventAssets(event) {
  return {
    bannerUrl: getUploadUrl(event?.banner_image),
    logoUrl: getUploadUrl(event?.logo_image),
  };
}

export function getEventThemeStyle(event) {
  const theme = resolveEventTheme(event);
  const primaryHover = darkenHex(theme.primary);

  return {
    '--event-primary': theme.primary,
    '--event-secondary': theme.secondary,
    '--event-accent': theme.accent,
    '--primary': theme.primary,
    '--secondary': theme.secondary,
    '--accent': theme.accent,
    '--primary-hover': primaryHover,
    '--primary-soft': hexToRgba(theme.primary, 0.12),
    '--secondary-soft': hexToRgba(theme.secondary, 0.15),
    '--border': hexToRgba(theme.secondary, 0.35),
    '--hero-overlay-top': hexToRgba(theme.primary, 0.35),
    '--hero-overlay-mid': hexToRgba('#1F2937', 0.55),
    '--hero-overlay-bottom': 'rgba(250, 247, 242, 0.95)',
    '--btn-shadow': hexToRgba(theme.primary, 0.25),
    '--btn-shadow-hover': hexToRgba(theme.primary, 0.32),
  };
}

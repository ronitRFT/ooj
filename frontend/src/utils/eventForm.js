import { DEFAULT_THEME } from './eventTheme';

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  description: '',
  venue: '',
  event_date: '',
  event_time: '18:00',
  host_name: '',
  yogi_name: '',
  about_yogi: '',
  about_foundation: '',
  rsvp_contact: '',
  invitation_text: '',
  theme_primary: DEFAULT_THEME.theme_primary,
  theme_secondary: DEFAULT_THEME.theme_secondary,
  theme_accent: DEFAULT_THEME.theme_accent,
  status: 'draft',
};

export function emptyEventForm() {
  return { ...EMPTY_FORM };
}

function parseEventDateTime(eventDate) {
  if (!eventDate) return { date: '', time: '18:00' };

  const raw = String(eventDate);
  if (raw.includes('T')) {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return { date: '', time: '18:00' };
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return { date, time };
  }

  const [datePart, timePart] = raw.split(' ');
  return {
    date: datePart || '',
    time: timePart ? timePart.slice(0, 5) : '18:00',
  };
}

export function eventToForm(event) {
  if (!event) return emptyEventForm();
  const { date, time } = parseEventDateTime(event.event_date);

  return {
    title: event.title || '',
    subtitle: event.subtitle || '',
    description: event.description || '',
    venue: event.venue || '',
    event_date: date,
    event_time: time,
    host_name: event.host_name || '',
    yogi_name: event.yogi_name || '',
    about_yogi: event.about_yogi || '',
    about_foundation: event.about_foundation || '',
    rsvp_contact: event.rsvp_contact || '',
    invitation_text: event.invitation_text || '',
    theme_primary: event.theme_primary || DEFAULT_THEME.theme_primary,
    theme_secondary: event.theme_secondary || DEFAULT_THEME.theme_secondary,
    theme_accent: event.theme_accent || DEFAULT_THEME.theme_accent,
    status: event.status || 'draft',
    banner_image: event.banner_image,
    logo_image: event.logo_image,
  };
}

export function formToFormData(form, bannerFile, logoFile) {
  const fd = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    if (key === 'banner_image' || key === 'logo_image') return;
    if (value !== undefined && value !== null) {
      fd.append(key, value);
    }
  });
  if (bannerFile) fd.append('banner', bannerFile);
  if (logoFile) fd.append('logo', logoFile);
  return fd;
}

export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export function getStatusOptions(currentStatus) {
  if (currentStatus === 'active') {
    return STATUS_OPTIONS.filter((option) => option.value === 'active');
  }

  return STATUS_OPTIONS.filter((option) => option.value !== 'archived');
}

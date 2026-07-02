import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ADMIN_TOKEN_KEY = 'adminToken';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function buildAuthHeaders() {
  const token = getAdminToken();
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

function handleUnauthorized() {
  clearAdminToken();
  const isAdminRoute = window.location.pathname.startsWith('/admin')
    && !window.location.pathname.startsWith('/admin/login');

  if (isAdminRoute) {
    window.location.href = '/admin/login';
  }
}

api.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

function adminRequest(method, url, data) {
  const headers = buildAuthHeaders();
  if (!headers) {
    handleUnauthorized();
    return Promise.reject({
      response: { status: 401, data: { message: 'Unauthorized' } },
      code: 'NO_TOKEN',
    });
  }
  return api({ method, url, data, headers });
}

function adminPost(url, data) {
  return adminRequest('post', url, data);
}

function adminGet(url) {
  return adminRequest('get', url);
}

function adminPut(url, data) {
  return adminRequest('put', url, data);
}

function adminPatch(url, data) {
  return adminRequest('patch', url, data);
}

function adminDelete(url) {
  return adminRequest('delete', url);
}

export const eventAPI = {
  getActive: () => api.get('/events/active'),
};

export const guestAPI = {
  register: (data) => api.post('/guests/register', data),
  getSuccessByUuid: (uuid) => api.get(`/guests/uuid/${uuid}/success`),
};

export const adminAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  logout: () => adminPost('/admin/logout', {}),
  getGuests: () => adminGet('/admin/guests'),
  getGuestsByEvent: (eventId) => adminGet(`/admin/guests/event/${eventId}`),
  checkIn: (data) => adminPost('/admin/check-in', data),
  getEvents: () => adminGet('/admin/events'),
  getEvent: (id) => adminGet(`/admin/events/${id}`),
  getRegistrationQr: () => adminGet('/admin/registration-qr'),
  getGuestAssets: (id) => adminGet(`/admin/guests/${id}/assets`),
  updateGuestAttendance: (id, isAttended) => adminPatch(`/admin/guests/${id}/attendance`, { is_attended: isAttended }),
  createEvent: (formData) => adminPost('/admin/events', formData),
  updateEvent: (id, formData) => adminPut(`/admin/events/${id}`, formData),
  setActiveEvent: (id) => adminPost(`/admin/events/${id}/set-active`, {}),
  duplicateEvent: (id) => adminPost(`/admin/events/${id}/duplicate`, {}),
  archiveEvent: (id) => adminPost(`/admin/events/${id}/archive`, {}),
  deleteEvent: (id) => adminDelete(`/admin/events/${id}`),
};

export const getUploadUrl = (path) => {
  if (!path) return null;
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${base}${path}`;
};

export default api;

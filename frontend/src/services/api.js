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

let unauthorizedRedirect = '/admin/login';

export function setUnauthorizedRedirect(path) {
  unauthorizedRedirect = path;
}

function handleUnauthorized() {
  clearAdminToken();
  const isAdminRoute = window.location.pathname.startsWith('/admin')
    && !window.location.pathname.startsWith('/admin/login');

  if (isAdminRoute) {
    window.location.href = unauthorizedRedirect;
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

function adminPost(url, data) {
  const headers = buildAuthHeaders();
  if (!headers) {
    handleUnauthorized();
    return Promise.reject({
      response: { status: 401, data: { message: 'Unauthorized' } },
      code: 'NO_TOKEN',
    });
  }
  return api.post(url, data, { headers });
}

function adminGet(url) {
  const headers = buildAuthHeaders();
  if (!headers) {
    handleUnauthorized();
    return Promise.reject({
      response: { status: 401, data: { message: 'Unauthorized' } },
      code: 'NO_TOKEN',
    });
  }
  return api.get(url, { headers });
}

export const eventAPI = {
  getActive: () => api.get('/events/active'),
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  getRegistrationQr: () => api.get('/events/registration-qr'),
};

export const guestAPI = {
  register: (data) => api.post('/guests/register', data),
  getByUuid: (uuid) => api.get(`/guests/uuid/${uuid}`),
  checkIn: (data) => api.post('/guests/check-in', data),
};

export const adminAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  logout: () => adminPost('/admin/logout', {}),
  getStats: () => adminGet('/admin/stats'),
  getGuests: () => adminGet('/admin/guests'),
  getGuestsByEvent: (eventId) => adminGet(`/admin/guests/event/${eventId}`),
  getEvents: () => adminGet('/admin/events'),
  getRegistrationQr: () => adminGet('/admin/registration-qr'),
  getShareInfo: () => adminGet('/admin/share'),
  sendEmailInvite: (data) => adminPost('/admin/share/email', data),
  createEvent: (data) => adminPost('/admin/events', data),
  updateEvent: (id, data) => api.put(`/admin/events/${id}`, data, { headers: buildAuthHeaders() || {} }),
};

export const getUploadUrl = (path) => {
  if (!path) return null;
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${base}${path}`;
};

export default api;

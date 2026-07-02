const ADMIN_TOKEN_KEY = 'adminToken';

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload;
  } catch {
    return null;
  }
}

export function isAdminTokenValid(token) {
  if (!token || typeof token !== 'string') return false;

  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  if (payload.role !== 'admin') return false;

  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    return false;
  }

  return true;
}

export function getStoredAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function isStoredAdminTokenValid() {
  return isAdminTokenValid(getStoredAdminToken());
}

export { ADMIN_TOKEN_KEY };

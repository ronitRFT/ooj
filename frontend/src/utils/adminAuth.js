const ADMIN_TOKEN_KEY = 'adminToken';

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  VOLUNTEER: 'volunteer',
});

const VALID_ROLES = Object.freeze(Object.values(ROLES));

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

export function getAdminRole(token) {
  const payload = decodeJwtPayload(token);
  return payload && VALID_ROLES.includes(payload.role) ? payload.role : null;
}

export function getAdminId(token) {
  const payload = decodeJwtPayload(token);
  return payload?.id ?? null;
}

export function isAdminTokenValid(token) {
  if (!token || typeof token !== 'string') return false;

  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  if (!VALID_ROLES.includes(payload.role)) return false;

  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    return false;
  }

  return true;
}

export function getStoredAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getStoredAdminRole() {
  return getAdminRole(getStoredAdminToken());
}

export function getStoredAdminId() {
  return getAdminId(getStoredAdminToken());
}

export function isStoredAdminTokenValid() {
  return isAdminTokenValid(getStoredAdminToken());
}

export function hasRole(allowedRoles, token = getStoredAdminToken()) {
  const role = getAdminRole(token);
  return role != null && allowedRoles.includes(role);
}

export function defaultRouteForRole(role) {
  if (role === ROLES.VOLUNTEER) return '/admin/volunteer';
  return '/admin/dashboard';
}

export { ADMIN_TOKEN_KEY, VALID_ROLES };

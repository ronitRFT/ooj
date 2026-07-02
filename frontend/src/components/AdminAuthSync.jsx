import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ADMIN_TOKEN_KEY, isAdminTokenValid, isStoredAdminTokenValid } from '../utils/adminAuth';
import { clearAdminToken } from '../services/api';

export default function AdminAuthSync() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const syncAuth = (token) => {
      const isAdminRoute = location.pathname.startsWith('/admin');
      const isLoginRoute = location.pathname.startsWith('/admin/login');
      const valid = token && isAdminTokenValid(token);

      if (!valid) {
        if (isAdminRoute && !isLoginRoute) {
          clearAdminToken();
          navigate('/admin/login', { replace: true });
        }
        return;
      }

      if (isLoginRoute) {
        navigate('/admin/dashboard', { replace: true });
      }
    };

    const onStorage = (event) => {
      if (event.key !== ADMIN_TOKEN_KEY) return;
      syncAuth(event.newValue);
    };

    const onFocus = () => {
      if (!location.pathname.startsWith('/admin')) return;
      syncAuth(localStorage.getItem(ADMIN_TOKEN_KEY));
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    if (location.pathname.startsWith('/admin') && !location.pathname.startsWith('/admin/login')) {
      if (!isStoredAdminTokenValid()) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
      }
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [location.pathname, navigate]);

  return null;
}

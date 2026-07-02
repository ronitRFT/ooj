import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isStoredAdminTokenValid } from '../utils/adminAuth';
import { clearAdminToken } from '../services/api';

export default function ProtectedAdminRoute() {
  const location = useLocation();

  if (!isStoredAdminTokenValid()) {
    clearAdminToken();
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

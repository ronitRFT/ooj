import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  isStoredAdminTokenValid,
  hasRole,
  getStoredAdminRole,
  defaultRouteForRole,
} from '../utils/adminAuth';
import { clearAdminToken } from '../services/api';

export default function ProtectedAdminRoute({ allowedRoles }) {
  const location = useLocation();

  if (!isStoredAdminTokenValid()) {
    clearAdminToken();
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to={defaultRouteForRole(getStoredAdminRole())} replace />;
  }

  return <Outlet />;
}

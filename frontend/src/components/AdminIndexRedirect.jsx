import { Navigate } from 'react-router-dom';
import {
  isStoredAdminTokenValid,
  getStoredAdminRole,
  defaultRouteForRole,
} from '../utils/adminAuth';

export default function AdminIndexRedirect() {
  if (!isStoredAdminTokenValid()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Navigate to={defaultRouteForRole(getStoredAdminRole())} replace />;
}

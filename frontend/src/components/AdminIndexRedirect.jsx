import { Navigate } from 'react-router-dom';
import { isStoredAdminTokenValid } from '../utils/adminAuth';

export default function AdminIndexRedirect() {
  return (
    <Navigate to={isStoredAdminTokenValid() ? '/admin/dashboard' : '/admin/login'} replace />
  );
}

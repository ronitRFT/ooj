import { Navigate } from 'react-router-dom';

export default function AdminIndexRedirect() {
  const token = localStorage.getItem('adminToken');
  return <Navigate to={token ? '/admin/dashboard' : '/admin/login'} replace />;
}

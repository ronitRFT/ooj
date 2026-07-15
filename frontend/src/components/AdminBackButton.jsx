import { Link, useLocation } from 'react-router-dom';
import { getStoredAdminRole, defaultRouteForRole } from '../utils/adminAuth';
import './AdminBackButton.css';

export default function AdminBackButton() {
  const location = useLocation();
  const home = defaultRouteForRole(getStoredAdminRole());

  if (location.pathname === home) {
    return (
      <Link to="/" className="admin-back-btn">
        ← Back to Home
      </Link>
    );
  }

  const label = home === '/admin/scanner' ? '← Back to Scanner' : '← Back to Dashboard';

  return (
    <Link to={home} className="admin-back-btn">
      {label}
    </Link>
  );
}

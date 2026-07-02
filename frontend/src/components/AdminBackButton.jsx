import { Link, useLocation } from 'react-router-dom';
import './AdminBackButton.css';

export default function AdminBackButton() {
  const location = useLocation();

  if (location.pathname === '/admin/dashboard') {
    return (
      <Link to="/" className="admin-back-btn">
        ← Back to Home
      </Link>
    );
  }

  return (
    <Link to="/admin/dashboard" className="admin-back-btn">
      ← Back to Dashboard
    </Link>
  );
}

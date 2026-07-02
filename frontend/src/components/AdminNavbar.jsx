import { Link, useLocation, useNavigate } from 'react-router-dom';
import { adminAPI, clearAdminToken } from '../services/api';
import './AdminNavbar.css';

export default function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await adminAPI.logout();
    } catch {
      // ignore logout errors
    }
    clearAdminToken();
    navigate('/admin/login', { replace: true });
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-inner">
        <Link to="/admin/dashboard" className="admin-navbar-brand">
          <span className="brand-accent">OOJ</span> Admin
        </Link>
        <div className="admin-navbar-links">
          <Link
            to="/admin/dashboard"
            className={isActive('/admin/dashboard') ? 'active' : ''}
          >
            Dashboard
          </Link>
          <Link
            to="/admin/registration"
            className={isActive('/admin/registration') ? 'active' : ''}
          >
            Public Registration Page
          </Link>
          <Link
            to="/admin/scanner"
            className={isActive('/admin/scanner') ? 'active' : ''}
          >
            Scanner Page
          </Link>
          <button type="button" onClick={handleLogout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

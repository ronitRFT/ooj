import { Link, useLocation } from 'react-router-dom';
import { useActiveEvent } from '../context/ActiveEventContext';
import { isStoredAdminTokenValid } from '../utils/adminAuth';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const { assets, copy, loading } = useActiveEvent();
  const isAdmin = isStoredAdminTokenValid();
  const adminLink = isAdmin ? '/admin/dashboard' : '/admin/login';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          {assets.logoUrl ? (
            <img src={assets.logoUrl} alt={`${copy.brand_name} logo`} className="navbar-logo" />
          ) : (
            <span className="brand-mark">ॐ</span>
          )}
          <span className="brand-text">
            <strong>{copy.brand_name}</strong>
            {copy.brand_tagline && <small>{copy.brand_tagline}</small>}
          </span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/register" className={location.pathname === '/register' ? 'active' : ''}>Register</Link>
          {isAdmin && (
            <Link to="/admin/scanner" className={location.pathname === '/admin/scanner' ? 'active' : ''}>Check-In</Link>
          )}
          <Link
            to={adminLink}
            className={`nav-admin ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
          >
            Admin
          </Link>
        </div>
      </div>
      {!loading && !assets.logoUrl && <span className="sr-only">{copy.brand_name}</span>}
    </nav>
  );
}

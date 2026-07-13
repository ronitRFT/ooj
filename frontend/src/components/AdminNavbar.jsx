import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { adminAPI, clearAdminToken } from '../services/api';
import './AdminNavbar.css';

const NAV_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/scanner', label: 'Scanner', highlight: true },
  { to: '/admin/registration', label: 'Registration Preview' },
];

export default function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

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
        <Link to="/admin/dashboard" className="admin-navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-accent">OOJ</span> Foundation Admin
        </Link>

        <button
          type="button"
          className={`admin-navbar-toggle${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="admin-navbar-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          id="admin-navbar-menu"
          className={`admin-navbar-links${menuOpen ? ' open' : ''}`}
          role="navigation"
        >
          {NAV_LINKS.map(({ to, label, highlight }) => (
            <Link
              key={to}
              to={to}
              className={`${isActive(to) ? 'active' : ''}${highlight ? ' nav-highlight' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <button type="button" onClick={handleLogout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="admin-navbar-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
}

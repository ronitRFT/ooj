import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { adminAPI, clearAdminToken } from '../services/api';
import { ROLES, getStoredAdminRole, defaultRouteForRole } from '../utils/adminAuth';
import './AdminNavbar.css';

const ALL_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.VOLUNTEER];

const NAV_LINKS = [
  { to: '/admin/volunteer', label: 'Dashboard', roles: [ROLES.VOLUNTEER] },
  { to: '/admin/dashboard', label: 'Dashboard', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { to: '/admin/events', label: 'Events', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { to: '/admin/reports', label: 'Reports', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { to: '/admin/scanner', label: 'Scanner', highlight: true, roles: ALL_ROLES },
  { to: '/admin/registration', label: 'Registration Preview', roles: ALL_ROLES },
  { to: '/admin/admins', label: 'Admins', roles: [ROLES.SUPER_ADMIN] },
];

const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.VOLUNTEER]: 'Volunteer',
};

export default function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = getStoredAdminRole();
  const visibleLinks = NAV_LINKS.filter(({ roles }) => roles.includes(role));

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
        <Link to={defaultRouteForRole(role)} className="admin-navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="admin-navbar-mark" aria-hidden="true">OOJ</span>
          <span className="admin-navbar-brand-text">
            <span className="admin-navbar-brand-title">Foundation Admin</span>
            <span className="admin-navbar-brand-sub">Event Management</span>
          </span>
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
          <div className="admin-navbar-nav">
            {visibleLinks.map(({ to, label, highlight }) => (
              <Link
                key={to}
                to={to}
                className={`${isActive(to) ? 'active' : ''}${highlight ? ' nav-highlight' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="admin-navbar-account">
            {role && (
              <span className={`admin-role-badge role-${role}`}>
                {ROLE_LABELS[role] || role}
              </span>
            )}
            <button type="button" onClick={handleLogout} className="admin-logout-btn">
              Logout
            </button>
          </div>
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

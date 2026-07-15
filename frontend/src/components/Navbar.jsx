import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isStoredAdminTokenValid } from '../utils/adminAuth';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const isAdmin = isStoredAdminTokenValid();
  const adminLink = isAdmin ? '/admin/dashboard' : '/admin/login';
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

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-text">
            <strong>OOJ Foundation</strong>
            <small>Life Energy Invigorated</small>
          </span>
        </Link>

        <button
          type="button"
          className={`navbar-toggle${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          id="navbar-menu"
          className={`navbar-links${menuOpen ? ' open' : ''}`}
          role="navigation"
        >
          <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/register" className={location.pathname === '/register' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Register</Link>
          {isAdmin && (
            <Link to="/admin/scanner" className={location.pathname === '/admin/scanner' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Check-In</Link>
          )}
          <Link
            to={adminLink}
            className={`nav-login-btn ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {isAdmin ? 'Dashboard' : 'Login'}
          </Link>
        </div>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="navbar-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
}

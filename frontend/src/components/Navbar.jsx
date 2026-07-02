import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const adminToken = localStorage.getItem('adminToken');
  const adminLink = adminToken ? '/admin/dashboard' : '/admin/login';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-accent">OOJ</span> Event Management
        </Link>
        <div className="navbar-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/register" className={location.pathname === '/register' ? 'active' : ''}>Register</Link>
          <Link to="/scanner" className={location.pathname === '/scanner' ? 'active' : ''}>Check-In</Link>
          <Link
            to={adminLink}
            className={location.pathname.startsWith('/admin') ? 'active' : ''}
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}

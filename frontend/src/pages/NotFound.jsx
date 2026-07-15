import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound({ admin = false }) {
  return (
    <div className="not-found page-center">
      <h1>404</h1>
      <p>Page not found</p>
      <Link to={admin ? '/admin/dashboard' : '/'} className="btn btn-primary">
        {admin ? 'Go to Dashboard' : 'Go to Home'}
      </Link>
    </div>
  );
}

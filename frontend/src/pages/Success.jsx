import { useLocation, Navigate, Link } from 'react-router-dom';
import QRDisplay from '../components/QRDisplay';
import './Success.css';

export default function Success() {
  const location = useLocation();
  const guest = location.state?.guest;

  if (!guest) {
    return <Navigate to="/register" replace />;
  }

  return (
    <div className="success-page page-center">
      <QRDisplay guest={guest} />
      <Link to="/" className="back-link">← Back to Home</Link>
    </div>
  );
}

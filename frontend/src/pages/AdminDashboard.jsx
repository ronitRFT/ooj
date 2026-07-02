import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import StatsCard from '../components/StatsCard';
import GuestManagement from '../components/GuestManagement';
import EventQrCard from '../components/EventQrCard';
import ShareInvitation from '../components/ShareInvitation';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [eventQr, setEventQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      adminAPI.getStats(),
      adminAPI.getRegistrationQr(),
    ])
      .then(([statsRes, qrRes]) => {
        setStats(statsRes.data.data);
        setEventQr(qrRes.data.data);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login', { replace: true });
        } else {
          setError('Failed to load dashboard data');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return <div className="page-center"><div className="loader">Loading dashboard...</div></div>;
  }

  if (error) {
    return <div className="page-center"><div className="error-box">{error}</div></div>;
  }

  const attendanceRate = stats.total_guests > 0
    ? Math.round((stats.total_attended / stats.total_guests) * 100)
    : 0;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Event management overview</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatsCard label="Total Guests" value={stats.total_guests} accent />
        <StatsCard label="Checked In" value={stats.total_attended} accent="success" />
        <StatsCard label="Pending" value={stats.total_pending} />
        <StatsCard label="Attendance Rate" value={`${attendanceRate}%`} />
      </div>

      {eventQr && <EventQrCard qrData={eventQr} />}

      {eventQr && (
        <ShareInvitation
          registrationUrl={eventQr.registration_url}
          eventTitle={eventQr.event?.title}
        />
      )}

      <GuestManagement />
    </div>
  );
}

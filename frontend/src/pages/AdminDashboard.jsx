import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { adminAPI, clearAdminToken } from '../services/api';
import { useActiveEvent } from '../context/ActiveEventContext';
import StatsCard from '../components/StatsCard';
import GuestManagement from '../components/GuestManagement';
import EventQrCard from '../components/EventQrCard';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { event: activeEvent } = useActiveEvent();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [eventQr, setEventQr] = useState(null);
  const [dashboardNotice, setDashboardNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');
  const lastActiveEventIdRef = useRef(null);

  const handleStatsUpdate = useCallback((stats) => {
    setEventStats(stats);
  }, []);

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    const notices = [];

    if (!silent) {
      setLoading(true);
      setFatalError('');
    }

    try {
      const [eventsResult, qrResult] = await Promise.allSettled([
        adminAPI.getEvents(),
        adminAPI.getRegistrationQr(),
      ]);

      const authFailure = [eventsResult, qrResult].find(
        (result) => result.status === 'rejected'
          && (result.reason?.response?.status === 401 || result.reason?.code === 'NO_TOKEN'),
      );

      if (authFailure) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }

      if (eventsResult.status === 'fulfilled') {
        const eventList = eventsResult.value.data.data || [];
        setEvents(eventList);
        setSelectedEventId((current) => {
          if (current != null && current !== 'all') {
            const stillExists = eventList.some((event) => event.id === current);
            if (stillExists) return current;
          }
          const active = eventList.find((event) => event.status === 'active');
          return active?.id ?? 'all';
        });
      } else if (!silent) {
        setFatalError('Failed to load events');
        setSelectedEventId('all');
      }

      if (qrResult.status === 'fulfilled') {
        setEventQr(qrResult.value.data.data);
        if (qrResult.value.data.message) {
          notices.push(qrResult.value.data.message);
        }
      } else {
        notices.push('Registration QR is temporarily unavailable.');
      }
    } catch {
      if (!silent) {
        setFatalError('Failed to load dashboard');
      }
    } finally {
      setDashboardNotice(notices.join(' '));
      if (!silent) {
        setLoading(false);
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (location.pathname !== '/admin/dashboard') return;
    loadDashboard();
  }, [location.pathname, loadDashboard]);

  useEffect(() => {
    const onFocus = () => {
      if (location.pathname === '/admin/dashboard') {
        loadDashboard({ silent: true });
      }
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [location.pathname, loadDashboard]);

  useEffect(() => {
    const activeId = activeEvent?.id ?? null;
    if (lastActiveEventIdRef.current === null) {
      lastActiveEventIdRef.current = activeId;
      return;
    }

    if (activeId !== lastActiveEventIdRef.current) {
      lastActiveEventIdRef.current = activeId;
      if (location.pathname === '/admin/dashboard') {
        loadDashboard({ silent: true });
      }
    }
  }, [activeEvent?.id, location.pathname, loadDashboard]);

  if (loading) {
    return <div className="page-center"><div className="loader">Loading dashboard...</div></div>;
  }

  if (fatalError) {
    return <div className="page-center"><div className="error-box">{fatalError}</div></div>;
  }

  const displayStats = eventStats || {
    total_guests: 0,
    total_attended: 0,
    total_pending: 0,
    event_title: '',
  };

  const attendanceRate = displayStats.total_guests > 0
    ? Math.round((displayStats.total_attended / displayStats.total_guests) * 100)
    : 0;

  const statsLabel = displayStats.event_title
    ? `Showing stats for: ${displayStats.event_title}`
    : 'Guest statistics update with the selected event filter';

  return (
    <div className="admin-dashboard fade-in">
      <header className="dashboard-header">
        <div>
          <span className="section-label">Administration</span>
          <h1>Dashboard</h1>
          <p>{statsLabel}</p>
        </div>
        <Link to="/admin/events" className="btn btn-outline btn-sm">Manage Events</Link>
      </header>

      {dashboardNotice && (
        <div className="dashboard-notice">{dashboardNotice}</div>
      )}

      <div className="stats-grid">
        <StatsCard label="Total Guests" value={displayStats.total_guests} variant="primary" />
        <StatsCard label="Checked In" value={displayStats.total_attended} variant="success" />
        <StatsCard label="Pending" value={displayStats.total_pending} variant="muted" />
        <StatsCard label="Attendance Rate" value={`${attendanceRate}%`} variant="gold" />
      </div>

      {eventQr && <EventQrCard qrData={eventQr} />}

      <GuestManagement
        events={events}
        selectedEventId={selectedEventId}
        onEventChange={setSelectedEventId}
        onStatsUpdate={handleStatsUpdate}
      />
    </div>
  );
}

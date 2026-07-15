import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { adminAPI, clearAdminToken } from '../services/api';
import { useActiveEvent } from '../context/ActiveEventContext';
import StatsCard from '../components/StatsCard';
import GuestManagement from '../components/GuestManagement';
import EventQrCard from '../components/EventQrCard';
import './AdminDashboard.css';

function LiveCheckInCard({ active }) {
  const total = active.total_guests || 0;
  const attended = active.total_attended || 0;
  const progress = total > 0 ? Math.round((attended / total) * 100) : 0;
  const timeline = active.check_in_timeline || [];
  const maxBucket = Math.max(1, ...timeline.map((t) => t.count));

  return (
    <section className="live-checkin-card">
      <header className="live-checkin-header">
        <div>
          <span className="section-label">Live Check-in</span>
          <h2>{active.title}</h2>
        </div>
        <div className="live-checkin-meta">
          <span className="live-checkin-pending-inv">
            {active.invitation_pending} invitation{active.invitation_pending !== 1 ? 's' : ''} pending
          </span>
        </div>
      </header>

      <div className="live-checkin-progress">
        <div className="live-checkin-progress-track">
          <div className="live-checkin-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="live-checkin-progress-label">
          <strong>{attended}</strong> of <strong>{total}</strong> checked in ({progress}%)
          {' · '}
          <span className="live-checkin-remaining">{active.total_pending} remaining</span>
        </p>
      </div>

      {timeline.length > 0 && (
        <div className="live-checkin-timeline">
          <span className="live-checkin-timeline-title">Check-ins over time</span>
          <div className="live-checkin-spark">
            {timeline.map((bucket, idx) => (
              <span
                key={idx}
                className="live-checkin-spark-bar"
                style={{ height: `${Math.max(8, (bucket.count / maxBucket) * 100)}%` }}
                title={`${bucket.bucket}: ${bucket.count}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { event: activeEvent } = useActiveEvent();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [eventQr, setEventQr] = useState(null);
  const [liveStats, setLiveStats] = useState(null);
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
      const [eventsResult, qrResult, statsResult] = await Promise.allSettled([
        adminAPI.getEvents(),
        adminAPI.getRegistrationQr(),
        adminAPI.getStats(),
      ]);

      const authFailure = [eventsResult, qrResult, statsResult].find(
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

      if (statsResult.status === 'fulfilled') {
        setLiveStats(statsResult.value.data.data);
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

      {liveStats?.active_event && (
        <LiveCheckInCard active={liveStats.active_event} />
      )}

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

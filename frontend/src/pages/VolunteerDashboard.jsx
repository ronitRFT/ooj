import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import './VolunteerDashboard.css';

function formatEventDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VolunteerDashboard() {
  const [events, setEvents] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [eventFilter, setEventFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [eventsRes, guestsRes] = await Promise.all([
          adminAPI.getVolunteerEvents(),
          adminAPI.getVolunteerGuests(),
        ]);
        if (cancelled) return;
        setEvents(eventsRes.data?.data || []);
        setGuests(guestsRes.data?.data || []);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeEvent = useMemo(
    () => events.find((e) => e.status === 'active') || null,
    [events]
  );

  const filteredGuests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return guests.filter((g) => {
      const matchesEvent =
        eventFilter === 'all' || String(g.event_id) === String(eventFilter);
      if (!matchesEvent) return false;
      if (!term) return true;
      return (
        (g.full_name || '').toLowerCase().includes(term) ||
        (g.email || '').toLowerCase().includes(term) ||
        (g.phone || '').toLowerCase().includes(term) ||
        (g.organization || '').toLowerCase().includes(term)
      );
    });
  }, [guests, eventFilter, search]);

  const attendedCount = filteredGuests.filter((g) => g.is_attended).length;

  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedGuests = useMemo(
    () => filteredGuests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredGuests, currentPage]
  );

  // Reset to first page whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [eventFilter, search]);

  return (
    <div className="vol-dashboard">
      <header className="vol-header">
        <span className="vol-eyebrow">Volunteer</span>
        <h1>Volunteer Dashboard</h1>
        <p>
          {activeEvent
            ? <>Active event: <strong>{activeEvent.title}</strong></>
            : 'No active event is currently running.'}
        </p>
      </header>

      {/* Quick actions */}
      <section className="vol-actions">
        <Link to="/admin/scanner" className="vol-action-card vol-action-primary">
          <span className="vol-action-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
          </span>
          <span className="vol-action-body">
            <strong>Scanner</strong>
            <small>Scan guest QR codes to check them in</small>
          </span>
        </Link>

        <Link to="/admin/registration" className="vol-action-card">
          <span className="vol-action-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <line x1="8" y1="8" x2="16" y2="8" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="8" y1="16" x2="13" y2="16" />
            </svg>
          </span>
          <span className="vol-action-body">
            <strong>Registration Preview</strong>
            <small>See the public guest registration page</small>
          </span>
        </Link>
      </section>

      {error && <div className="vol-error" role="alert">{error}</div>}

      {loading ? (
        <div className="vol-loading">Loading…</div>
      ) : (
        <>
          {/* Events */}
          <section className="vol-section">
            <div className="vol-section-head">
              <h2>Events</h2>
              <span className="vol-count">{events.length} total</span>
            </div>
            <div className="vol-events-grid">
              {events.length === 0 && <p className="vol-empty">No events found.</p>}
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className={`vol-event-card${ev.status === 'active' ? ' is-active' : ''}`}
                >
                  <div className="vol-event-top">
                    <span className={`vol-status-badge status-${ev.status}`}>
                      {ev.status === 'active' && <span className="vol-live-dot" aria-hidden="true" />}
                      {ev.status}
                    </span>
                  </div>
                  <h3>{ev.title}</h3>
                  <p className="vol-event-meta">{formatEventDate(ev.event_date)}</p>
                  {ev.venue && <p className="vol-event-venue">{ev.venue}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* Guests with event filter */}
          <section className="vol-section">
            <div className="vol-section-head">
              <h2>Guests</h2>
              <span className="vol-count">
                {filteredGuests.length} shown · {attendedCount} checked in
              </span>
            </div>

            <div className="vol-toolbar">
              <div className="vol-field">
                <label htmlFor="vol-event-filter">Filter by event</label>
                <select
                  id="vol-event-filter"
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                >
                  <option value="all">All events</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}{ev.status === 'active' ? ' (active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="vol-field vol-field-grow">
                <label htmlFor="vol-search">Search</label>
                <input
                  id="vol-search"
                  type="search"
                  placeholder="Name, email, phone, organization…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredGuests.length === 0 ? (
              <p className="vol-empty">No guests match your filters.</p>
            ) : (
              <>
                <div className="vol-guest-grid">
                  {pagedGuests.map((g) => (
                    <div key={g.id} className="vol-guest-card">
                      <div className="vol-guest-main">
                        <span className="vol-guest-name">{g.full_name}</span>
                        <span
                          className={`vol-attend-badge ${g.is_attended ? 'attended' : 'pending'}`}
                        >
                          {g.is_attended ? 'Checked in' : 'Pending'}
                        </span>
                      </div>
                      <div className="vol-guest-contact">
                        {g.email && <span>{g.email}</span>}
                        {g.phone && <span>{g.phone}</span>}
                      </div>
                      <div className="vol-guest-event">{g.event_title}</div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="vol-pagination">
                    <button
                      type="button"
                      className="vol-page-btn"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="vol-page-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      className="vol-page-btn"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

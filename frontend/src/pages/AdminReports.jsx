import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { saveBlobAsDownload } from '../utils/download';
import StatsCard from '../components/StatsCard';
import './AdminReports.css';

const TABS = [
  { id: 'registration', label: 'Registration' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'invitation-status', label: 'Invitation Status' },
];

function errorMessage(err, fallback) {
  return err?.response?.data?.message || fallback;
}

function MiniBars({ items, labelKey, valueKey }) {
  if (!items || items.length === 0) {
    return <p className="reports-empty">No data yet.</p>;
  }
  const max = Math.max(...items.map((i) => i[valueKey])) || 1;
  return (
    <div className="reports-bars">
      {items.map((item, idx) => (
        <div className="reports-bar-row" key={idx}>
          <span className="reports-bar-label">{item[labelKey]}</span>
          <span className="reports-bar-track">
            <span
              className="reports-bar-fill"
              style={{ width: `${Math.max(4, (item[valueKey] / max) * 100)}%` }}
            />
          </span>
          <span className="reports-bar-value">{item[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminReports() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [activeTab, setActiveTab] = useState('registration');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;
    adminAPI.getEvents()
      .then(({ data }) => {
        if (mounted) setEvents(data.data || []);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (activeTab === 'registration') {
        response = await adminAPI.getRegistrationReport(selectedEventId);
      } else if (activeTab === 'attendance') {
        response = await adminAPI.getAttendanceReport(selectedEventId);
      } else {
        response = await adminAPI.getInvitationStatusReport(selectedEventId);
      }
      setReport(response.data.data);
    } catch (err) {
      setError(errorMessage(err, 'Failed to load report'));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedEventId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const { data } = await adminAPI.exportReport(activeTab, selectedEventId);
      const stamp = new Date().toISOString().slice(0, 10);
      saveBlobAsDownload(data, `${activeTab}-report-${stamp}.csv`);
    } catch (err) {
      setError(errorMessage(err, 'Failed to export report'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="admin-reports fade-in">
      <header className="reports-header">
        <div>
          <span className="section-label">Administration</span>
          <h1>Reports &amp; Analytics</h1>
          <p>Registration, attendance, and invitation insights.</p>
        </div>
      </header>

      <div className="reports-controls">
        <div className="reports-filter">
          <label htmlFor="reports-event">Event</label>
          <select
            id="reports-event"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}{event.status === 'active' ? ' (Active)' : ''}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-secondary reports-export-btn"
          onClick={handleExport}
          disabled={exporting || loading || !report}
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <div className="reports-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`reports-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="reports-error" role="alert">{error}</div>}

      {loading ? (
        <div className="reports-loading"><div className="loader">Loading report…</div></div>
      ) : report ? (
        <div className="reports-content">
          {activeTab === 'registration' && <RegistrationReport report={report} />}
          {activeTab === 'attendance' && <AttendanceReport report={report} />}
          {activeTab === 'invitation-status' && <InvitationStatusReport report={report} />}
        </div>
      ) : null}
    </div>
  );
}

function RegistrationReport({ report }) {
  return (
    <>
      <div className="stats-grid reports-stats">
        <StatsCard label="Total Registrations" value={report.total_registrations} variant="primary" />
        <StatsCard label="Events" value={report.by_event.length} variant="gold" />
      </div>

      <section className="reports-section">
        <h2>Registrations by Day</h2>
        <MiniBars items={report.by_day} labelKey="date" valueKey="count" />
      </section>

      <section className="reports-section">
        <h2>By Event</h2>
        <BreakdownTable
          columns={[
            { key: 'title', label: 'Event' },
            { key: 'status', label: 'Status' },
            { key: 'registrations', label: 'Registrations' },
            { key: 'attended', label: 'Attended' },
            { key: 'pending', label: 'Pending' },
          ]}
          rows={report.by_event}
        />
      </section>
    </>
  );
}

function AttendanceReport({ report }) {
  return (
    <>
      <div className="stats-grid reports-stats">
        <StatsCard label="Total Guests" value={report.total_guests} variant="primary" />
        <StatsCard label="Checked In" value={report.total_attended} variant="success" />
        <StatsCard label="Pending" value={report.total_pending} variant="muted" />
        <StatsCard label="Attendance Rate" value={`${report.attendance_rate}%`} variant="gold" />
      </div>

      <section className="reports-section">
        <h2>Check-in Timeline</h2>
        <MiniBars items={report.check_in_timeline} labelKey="bucket" valueKey="count" />
      </section>

      <section className="reports-section">
        <h2>By Event</h2>
        <BreakdownTable
          columns={[
            { key: 'title', label: 'Event' },
            { key: 'total', label: 'Total' },
            { key: 'attended', label: 'Checked In' },
            { key: 'pending', label: 'Pending' },
            { key: 'attendance_rate', label: 'Rate (%)' },
          ]}
          rows={report.by_event}
        />
      </section>
    </>
  );
}

function InvitationStatusReport({ report }) {
  return (
    <>
      <div className="stats-grid reports-stats">
        <StatsCard label="Invitations Ready" value={report.invitation_generated} variant="success" />
        <StatsCard label="Invitations Pending" value={report.invitation_pending} variant="muted" />
        <StatsCard label="QR Ready" value={report.qr_generated} variant="primary" />
        <StatsCard label="QR Pending" value={report.qr_pending} variant="muted" />
      </div>

      <section className="reports-section">
        <h2>By Event</h2>
        <BreakdownTable
          columns={[
            { key: 'title', label: 'Event' },
            { key: 'total', label: 'Total' },
            { key: 'invitation_generated', label: 'Inv. Ready' },
            { key: 'invitation_pending', label: 'Inv. Pending' },
            { key: 'qr_generated', label: 'QR Ready' },
            { key: 'qr_pending', label: 'QR Pending' },
          ]}
          rows={report.by_event}
        />
      </section>
    </>
  );
}

function BreakdownTable({ columns, rows }) {
  if (!rows || rows.length === 0) {
    return <p className="reports-empty">No events to show.</p>;
  }
  return (
    <div className="table-wrap">
      <table className="reports-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} scope="col">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.event_id}>
              {columns.map((c) => <td key={c.key}>{row[c.key] ?? '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

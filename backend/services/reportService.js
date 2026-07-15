const { pool } = require('../config/db');

// Format a DB DATE/DATETIME value as a local YYYY-MM-DD string (avoids the
// UTC shift that new Date().toISOString() introduces for non-UTC servers).
function formatDay(value) {
  if (!value) return '';
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value).slice(0, 10);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function rate(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

async function getRegistrationReport({ eventId = null } = {}) {
  const where = eventId ? ' WHERE g.event_id = ?' : '';
  const scopeParams = eventId ? [eventId] : [];

  const [totals] = await pool.execute(
    `SELECT COUNT(*) AS total_registrations FROM guests g${where}`,
    scopeParams
  );

  const [byEvent] = await pool.execute(
    `SELECT e.id AS event_id, e.title, e.status,
            COUNT(g.id) AS registrations,
            COALESCE(SUM(g.is_attended), 0) AS attended
     FROM events e
     LEFT JOIN guests g ON g.event_id = e.id
     ${eventId ? 'WHERE e.id = ?' : ''}
     GROUP BY e.id, e.title, e.status
     ORDER BY registrations DESC`,
    eventId ? [eventId] : []
  );

  const [byDay] = await pool.execute(
    `SELECT DATE(g.created_at) AS day, COUNT(*) AS count
     FROM guests g${where}
     GROUP BY DATE(g.created_at)
     ORDER BY day ASC`,
    scopeParams
  );

  return {
    scope: eventId ? 'event' : 'all',
    event_id: eventId,
    total_registrations: Number(totals[0].total_registrations) || 0,
    by_event: byEvent.map((r) => {
      const registrations = Number(r.registrations) || 0;
      const attended = Number(r.attended) || 0;
      return {
        event_id: r.event_id,
        title: r.title,
        status: r.status,
        registrations,
        attended,
        pending: registrations - attended,
      };
    }),
    by_day: byDay.map((r) => ({ date: formatDay(r.day), count: Number(r.count) || 0 })),
  };
}

async function getAttendanceReport({ eventId = null } = {}) {
  const where = eventId ? ' WHERE g.event_id = ?' : '';
  const scopeParams = eventId ? [eventId] : [];

  const [totals] = await pool.execute(
    `SELECT COUNT(*) AS total, COALESCE(SUM(is_attended), 0) AS attended
     FROM guests g${where}`,
    scopeParams
  );
  const total = Number(totals[0].total) || 0;
  const attended = Number(totals[0].attended) || 0;

  const timelineWhere = eventId
    ? ' WHERE g.event_id = ? AND g.attended_at IS NOT NULL'
    : ' WHERE g.attended_at IS NOT NULL';
  const [timeline] = await pool.execute(
    `SELECT DATE_FORMAT(g.attended_at, '%Y-%m-%d %H:00') AS bucket, COUNT(*) AS count
     FROM guests g${timelineWhere}
     GROUP BY bucket
     ORDER BY bucket ASC`,
    eventId ? [eventId] : []
  );

  const [byEvent] = await pool.execute(
    `SELECT e.id AS event_id, e.title,
            COUNT(g.id) AS total,
            COALESCE(SUM(g.is_attended), 0) AS attended
     FROM events e
     LEFT JOIN guests g ON g.event_id = e.id
     ${eventId ? 'WHERE e.id = ?' : ''}
     GROUP BY e.id, e.title
     ORDER BY total DESC`,
    eventId ? [eventId] : []
  );

  return {
    scope: eventId ? 'event' : 'all',
    event_id: eventId,
    total_guests: total,
    total_attended: attended,
    total_pending: total - attended,
    attendance_rate: rate(attended, total),
    check_in_timeline: timeline.map((r) => ({ bucket: r.bucket, count: Number(r.count) || 0 })),
    by_event: byEvent.map((r) => {
      const t = Number(r.total) || 0;
      const a = Number(r.attended) || 0;
      return {
        event_id: r.event_id,
        title: r.title,
        total: t,
        attended: a,
        pending: t - a,
        attendance_rate: rate(a, t),
      };
    }),
  };
}

async function getInvitationStatusReport({ eventId = null } = {}) {
  const where = eventId ? ' WHERE g.event_id = ?' : '';
  const scopeParams = eventId ? [eventId] : [];

  const [totals] = await pool.execute(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(invitation_pdf_path IS NOT NULL), 0) AS invitation_generated,
            COALESCE(SUM(qr_code_path IS NOT NULL), 0) AS qr_generated
     FROM guests g${where}`,
    scopeParams
  );
  const total = Number(totals[0].total) || 0;
  const invitationGenerated = Number(totals[0].invitation_generated) || 0;
  const qrGenerated = Number(totals[0].qr_generated) || 0;

  const [byEvent] = await pool.execute(
    `SELECT e.id AS event_id, e.title,
            COUNT(g.id) AS total,
            COALESCE(SUM(g.invitation_pdf_path IS NOT NULL), 0) AS invitation_generated,
            COALESCE(SUM(g.qr_code_path IS NOT NULL), 0) AS qr_generated
     FROM events e
     LEFT JOIN guests g ON g.event_id = e.id
     ${eventId ? 'WHERE e.id = ?' : ''}
     GROUP BY e.id, e.title
     ORDER BY total DESC`,
    eventId ? [eventId] : []
  );

  return {
    scope: eventId ? 'event' : 'all',
    event_id: eventId,
    total_guests: total,
    invitation_generated: invitationGenerated,
    invitation_pending: total - invitationGenerated,
    qr_generated: qrGenerated,
    qr_pending: total - qrGenerated,
    by_event: byEvent.map((r) => {
      const t = Number(r.total) || 0;
      const ig = Number(r.invitation_generated) || 0;
      const qg = Number(r.qr_generated) || 0;
      return {
        event_id: r.event_id,
        title: r.title,
        total: t,
        invitation_generated: ig,
        invitation_pending: t - ig,
        qr_generated: qg,
        qr_pending: t - qg,
      };
    }),
  };
}

module.exports = {
  formatDay,
  getRegistrationReport,
  getAttendanceReport,
  getInvitationStatusReport,
};

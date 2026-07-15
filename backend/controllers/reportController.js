const reportService = require('../services/reportService');
const { sendSuccess } = require('../utils/apiResponse');
const { sendInternalError } = require('../utils/safeError');
const { toCsv } = require('../utils/csv');

function parseEventId(req) {
  const value = req.query.event_id;
  return value ? value : null;
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

function sendCsv(res, filename, rows, columns) {
  const csv = toCsv(rows, columns);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csv);
}

async function registrationReport(req, res) {
  try {
    const data = await reportService.getRegistrationReport({ eventId: parseEventId(req) });
    return sendSuccess(res, 200, { data });
  } catch (error) {
    return sendInternalError(res, 'registrationReport', error);
  }
}

async function attendanceReport(req, res) {
  try {
    const data = await reportService.getAttendanceReport({ eventId: parseEventId(req) });
    return sendSuccess(res, 200, { data });
  } catch (error) {
    return sendInternalError(res, 'attendanceReport', error);
  }
}

async function invitationStatusReport(req, res) {
  try {
    const data = await reportService.getInvitationStatusReport({ eventId: parseEventId(req) });
    return sendSuccess(res, 200, { data });
  } catch (error) {
    return sendInternalError(res, 'invitationStatusReport', error);
  }
}

async function registrationExport(req, res) {
  try {
    const data = await reportService.getRegistrationReport({ eventId: parseEventId(req) });
    const columns = [
      { key: 'title', label: 'Event' },
      { key: 'status', label: 'Status' },
      { key: 'registrations', label: 'Registrations' },
      { key: 'attended', label: 'Attended' },
      { key: 'pending', label: 'Pending' },
    ];
    return sendCsv(res, `registration-report-${stamp()}.csv`, data.by_event, columns);
  } catch (error) {
    return sendInternalError(res, 'registrationExport', error);
  }
}

async function attendanceExport(req, res) {
  try {
    const data = await reportService.getAttendanceReport({ eventId: parseEventId(req) });
    const columns = [
      { key: 'title', label: 'Event' },
      { key: 'total', label: 'Total Guests' },
      { key: 'attended', label: 'Checked In' },
      { key: 'pending', label: 'Pending' },
      { key: 'attendance_rate', label: 'Attendance Rate (%)' },
    ];
    return sendCsv(res, `attendance-report-${stamp()}.csv`, data.by_event, columns);
  } catch (error) {
    return sendInternalError(res, 'attendanceExport', error);
  }
}

async function invitationStatusExport(req, res) {
  try {
    const data = await reportService.getInvitationStatusReport({ eventId: parseEventId(req) });
    const columns = [
      { key: 'title', label: 'Event' },
      { key: 'total', label: 'Total Guests' },
      { key: 'invitation_generated', label: 'Invitations Ready' },
      { key: 'invitation_pending', label: 'Invitations Pending' },
      { key: 'qr_generated', label: 'QR Ready' },
      { key: 'qr_pending', label: 'QR Pending' },
    ];
    return sendCsv(res, `invitation-status-report-${stamp()}.csv`, data.by_event, columns);
  } catch (error) {
    return sendInternalError(res, 'invitationStatusExport', error);
  }
}

module.exports = {
  registrationReport,
  attendanceReport,
  invitationStatusReport,
  registrationExport,
  attendanceExport,
  invitationStatusExport,
};

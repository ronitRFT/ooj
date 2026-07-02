const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { generateQRCode } = require('../utils/qrcode');
const { createInvitation } = require('./invitationService');
const { sendInvitationEmail } = require('./emailService');

async function getGuestByUuid(uuid) {
  const [rows] = await pool.execute(
    `SELECT g.*, e.title as event_title, e.venue, e.event_date
     FROM guests g JOIN events e ON g.event_id = e.id
     WHERE g.uuid = ?`,
    [uuid]
  );
  return rows[0] || null;
}

async function getGuestById(id) {
  const [rows] = await pool.execute('SELECT * FROM guests WHERE id = ?', [id]);
  return rows[0] || null;
}

async function getGuestsByEvent(eventId) {
  const [rows] = await pool.execute(
    'SELECT * FROM guests WHERE event_id = ? ORDER BY created_at DESC',
    [eventId]
  );
  return rows;
}

async function getAllGuests() {
  const [rows] = await pool.execute(
    `SELECT g.*, e.title as event_title
     FROM guests g JOIN events e ON g.event_id = e.id
     ORDER BY g.created_at DESC`
  );
  return rows;
}

async function registerGuest(data, event) {
  const guestUuid = uuidv4();
  const { event_id, full_name, email, phone, organization } = data;

  const [existing] = await pool.execute(
    'SELECT id FROM guests WHERE event_id = ? AND email = ?',
    [event_id, email]
  );
  if (existing.length > 0) {
    throw new Error('Email already registered for this event');
  }

  const [result] = await pool.execute(
    `INSERT INTO guests (event_id, uuid, full_name, email, phone, organization)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [event_id, guestUuid, full_name, email, phone || null, organization || null]
  );

  const guest = {
    id: result.insertId,
    uuid: guestUuid,
    full_name,
    email,
    phone,
    organization,
    event_id,
  };

  const qrCodePath = await generateQRCode(guestUuid, full_name);
  const invitation = await createInvitation(guest, event, qrCodePath);

  guest.qr_code_path = qrCodePath;
  guest.invitation_path = invitation.htmlPath;
  guest.invitation_pdf_path = invitation.pdfPath;
  guest.invitation_download_url = invitation.pdfPath || invitation.htmlPath;

  try {
    await pool.execute(
      `UPDATE guests SET qr_code_path = ?, invitation_path = ?, invitation_pdf_path = ?
       WHERE id = ?`,
      [qrCodePath, invitation.htmlPath, invitation.pdfPath, guest.id]
    );
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      await pool.execute(
        'UPDATE guests SET qr_code_path = ?, invitation_path = ? WHERE id = ?',
        [qrCodePath, invitation.pdfPath || invitation.htmlPath, guest.id]
      );
    } else {
      throw err;
    }
  }

  const emailResult = await sendInvitationEmail(guest, event, invitation, qrCodePath);
  guest.email_sent = emailResult.sent;

  if (!emailResult.sent) {
    console.warn(
      emailResult.skipped
        ? 'Invitation email skipped — email not configured or unavailable'
        : `Invitation email failed: ${emailResult.reason}`
    );
  }

  return guest;
}

async function checkInGuest(uuid) {
  const guest = await getGuestByUuid(uuid);

  if (!guest) {
    return { status: 'invalid_guest', message: 'Invalid Guest' };
  }

  if (guest.is_attended) {
    return {
      status: 'already_checked_in',
      message: 'Already Checked In',
      guest,
    };
  }

  await pool.execute(
    'UPDATE guests SET is_attended = 1, attended_at = NOW() WHERE uuid = ?',
    [uuid]
  );

  return {
    status: 'success',
    message: `Welcome ${guest.full_name}`,
    guest: { ...guest, is_attended: 1, attended_at: new Date() },
  };
}

async function markAttendance(uuid) {
  const result = await checkInGuest(uuid);
  if (result.status === 'invalid_guest') {
    throw new Error('Invalid Guest');
  }
  if (result.status === 'already_checked_in') {
    throw new Error('Already Checked In');
  }
  return result.guest;
}

async function getDashboardStats() {
  const [guestStats] = await pool.execute(`
    SELECT
      COUNT(*) as total_guests,
      SUM(is_attended) as total_attended,
      COUNT(*) - SUM(is_attended) as total_pending
    FROM guests
  `);

  const [eventCount] = await pool.execute('SELECT COUNT(*) as count FROM events');

  return {
    total_guests: guestStats[0].total_guests || 0,
    total_attended: guestStats[0].total_attended || 0,
    total_pending: guestStats[0].total_pending || 0,
    total_events: eventCount[0].count || 0,
  };
}

module.exports = {
  getGuestByUuid,
  getGuestById,
  getGuestsByEvent,
  getAllGuests,
  registerGuest,
  checkInGuest,
  markAttendance,
  getDashboardStats,
};

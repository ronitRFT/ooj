const { pool } = require('../config/db');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { generateQRCode } = require('../utils/qrcode');
const { createInvitation } = require('./invitationService');
const { sendInvitationEmail } = require('./emailService');
const { normalizePhoneForStorage } = require('../utils/phoneValidator');
const { deleteGuestAssetFiles, deleteUploadFile } = require('../utils/fileStorage');
const eventService = require('./eventService');

const DUPLICATE_MESSAGE = 'You are already registered for this event.';

const assetRecoveryLocks = new Map();

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function normalizePhone(phone) {
  return normalizePhoneForStorage(phone);
}

function formatGuestRecord(guest) {
  return {
    ...guest,
    invitation_download_url: guest.invitation_pdf_path || guest.invitation_path || null,
  };
}

async function findExistingGuestForEvent(eventId, email, phone) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  const [byEmail] = await pool.execute(
    'SELECT * FROM guests WHERE event_id = ? AND LOWER(TRIM(email)) = ? LIMIT 1',
    [eventId, normalizedEmail]
  );
  if (byEmail.length > 0) return byEmail[0];

  if (normalizedPhone) {
    const [candidates] = await pool.execute(
      `SELECT * FROM guests
       WHERE event_id = ?
         AND phone IS NOT NULL
         AND TRIM(phone) != ''`,
      [eventId]
    );
    const match = candidates.find((guest) => normalizePhone(guest.phone) === normalizedPhone);
    if (match) return match;
  }

  return null;
}

async function persistGuestAssets(guestId, qrCodePath, invitation) {
  try {
    await pool.execute(
      `UPDATE guests SET qr_code_path = ?, invitation_path = ?, invitation_pdf_path = ?
       WHERE id = ?`,
      [qrCodePath, invitation.htmlPath, invitation.pdfPath, guestId]
    );
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      await pool.execute(
        'UPDATE guests SET qr_code_path = ?, invitation_path = ? WHERE id = ?',
        [qrCodePath, invitation.pdfPath || invitation.htmlPath, guestId]
      );
    } else {
      throw err;
    }
  }
}

function fileExists(relativePath) {
  if (!relativePath) return false;
  const fullPath = path.join(__dirname, '..', relativePath.replace(/^\//, ''));
  return fs.existsSync(fullPath);
}

async function ensureGuestAssets(guest, event) {
  const lockKey = String(guest.id);
  if (assetRecoveryLocks.has(lockKey)) {
    return assetRecoveryLocks.get(lockKey);
  }

  const work = ensureGuestAssetsInternal(guest, event).finally(() => {
    assetRecoveryLocks.delete(lockKey);
  });

  assetRecoveryLocks.set(lockKey, work);
  return work;
}

async function ensureGuestAssetsInternal(guest, event) {
  const qrOnDisk = fileExists(guest.qr_code_path);
  const pdfOnDisk = fileExists(guest.invitation_pdf_path);
  const htmlOnDisk = fileExists(guest.invitation_path);

  if (qrOnDisk && pdfOnDisk) {
    return formatGuestRecord(guest);
  }

  if (!qrOnDisk) {
    console.info(
      `[assets] Regenerating missing QR for guest ${guest.uuid} `
      + `(previous path: ${guest.qr_code_path || 'none'})`
    );
  }

  if (!pdfOnDisk) {
    console.info(
      `[assets] Regenerating missing invitation PDF for guest ${guest.uuid} `
      + `(previous path: ${guest.invitation_pdf_path || 'none'})`
    );
  }

  if (!htmlOnDisk && guest.invitation_path) {
    console.info(
      `[assets] Regenerating missing invitation HTML for guest ${guest.uuid} `
      + `(previous path: ${guest.invitation_path})`
    );
  }

  const qrCodePath = qrOnDisk
    ? guest.qr_code_path
    : await generateQRCode(guest.uuid, guest.full_name);

  const invitation = pdfOnDisk
    ? {
      htmlPath: guest.invitation_path,
      pdfPath: guest.invitation_pdf_path,
    }
    : await createInvitation(guest, event, qrCodePath);

  await persistGuestAssets(guest.id, qrCodePath, invitation);

  return formatGuestRecord({
    ...guest,
    qr_code_path: qrCodePath,
    invitation_path: invitation.htmlPath,
    invitation_pdf_path: invitation.pdfPath,
  });
}

async function createNewGuestRegistration(data, event) {
  const { event_id, full_name, email, phone, organization } = data;
  const guestUuid = uuidv4();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  let guestId;
  try {
    const [result] = await pool.execute(
      `INSERT INTO guests (event_id, uuid, full_name, email, phone, organization)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [event_id, guestUuid, full_name.trim(), normalizedEmail, normalizedPhone, organization?.trim() || null]
    );
    guestId = result.insertId;
  } catch (err) {
    throw err;
  }

  const guest = {
    id: guestId,
    uuid: guestUuid,
    full_name: full_name.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    organization: organization?.trim() || null,
    event_id,
  };

  let qrCodePath;
  let invitation;

  try {
    qrCodePath = await generateQRCode(guestUuid, guest.full_name);
    invitation = await createInvitation(guest, event, qrCodePath);
    await persistGuestAssets(guest.id, qrCodePath, invitation);
  } catch (err) {
    await pool.execute('DELETE FROM guests WHERE id = ?', [guestId]);
    if (qrCodePath) deleteUploadFile(qrCodePath);
    if (invitation?.htmlPath) deleteUploadFile(invitation.htmlPath);
    if (invitation?.pdfPath) deleteUploadFile(invitation.pdfPath);
    throw err;
  }

  const formattedGuest = formatGuestRecord({
    ...guest,
    qr_code_path: qrCodePath,
    invitation_path: invitation.htmlPath,
    invitation_pdf_path: invitation.pdfPath,
  });

  const emailResult = await sendInvitationEmail(formattedGuest, event, invitation, qrCodePath);
  formattedGuest.email_sent = emailResult.sent;

  if (!emailResult.sent) {
    console.warn(
      emailResult.skipped
        ? 'Invitation email skipped — email not configured or unavailable'
        : `Invitation email failed: ${emailResult.reason}`
    );
  }

  return formattedGuest;
}

async function registerGuest(data, event) {
  const { event_id, email, phone } = data;

  const existing = await findExistingGuestForEvent(event_id, email, phone);
  if (existing) {
    const guest = await ensureGuestAssets(existing, event);
    return {
      guest,
      already_registered: true,
      message: DUPLICATE_MESSAGE,
    };
  }

  try {
    const guest = await createNewGuestRegistration(data, event);
    return {
      guest,
      already_registered: false,
      message: guest.email_sent
        ? 'Registration successful! Check your email for the invitation PDF.'
        : 'Registration successful! Download your invitation below.',
    };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const duplicate = await findExistingGuestForEvent(event_id, email, phone);
      if (duplicate) {
        const guest = await ensureGuestAssets(duplicate, event);
        return {
          guest,
          already_registered: true,
          message: DUPLICATE_MESSAGE,
        };
      }
    }
    throw err;
  }
}

async function getGuestSuccessByUuid(uuid) {
  const guest = await getGuestByUuid(uuid);
  if (!guest) return null;

  const event = await eventService.getEventById(guest.event_id);
  if (!event) return null;

  const ensured = await ensureGuestAssets(guest, event);

  return {
    guest: {
      uuid: ensured.uuid,
      full_name: ensured.full_name,
      organization: ensured.organization,
      qr_code_path: ensured.qr_code_path,
      invitation_path: ensured.invitation_path,
      invitation_pdf_path: ensured.invitation_pdf_path,
      invitation_download_url: ensured.invitation_download_url,
      attendance_status: ensured.is_attended ? 'checked_in' : 'not_checked_in',
    },
    event,
  };
}

async function getGuestByUuid(uuid) {
  const [rows] = await pool.execute(
    `SELECT g.*, e.title as event_title, e.venue, e.event_date
     FROM guests g JOIN events e ON g.event_id = e.id
     WHERE g.uuid = ?`,
    [uuid]
  );
  return rows[0] ? formatGuestRecord(rows[0]) : null;
}

async function getGuestById(id) {
  const [rows] = await pool.execute('SELECT * FROM guests WHERE id = ?', [id]);
  return rows[0] ? formatGuestRecord(rows[0]) : null;
}

async function getGuestsByEvent(eventId) {
  const [rows] = await pool.execute(
    'SELECT * FROM guests WHERE event_id = ? ORDER BY created_at DESC',
    [eventId]
  );
  return rows.map(formatGuestRecord);
}

async function getAllGuests() {
  const [rows] = await pool.execute(
    `SELECT g.*, e.title as event_title
     FROM guests g JOIN events e ON g.event_id = e.id
     ORDER BY g.created_at DESC`
  );
  return rows.map(formatGuestRecord);
}

async function checkInGuest(uuid) {
  const [rows] = await pool.execute(
    `SELECT g.uuid, g.full_name, g.organization, g.is_attended, g.event_id, e.status AS event_status
     FROM guests g
     JOIN events e ON g.event_id = e.id
     WHERE g.uuid = ?`,
    [uuid]
  );
  const guest = rows[0];

  if (!guest) {
    return { status: 'invalid_guest', message: 'Guest not found' };
  }

  if (guest.event_status !== 'active') {
    return {
      status: 'expired_event',
      message: 'This guest is not registered for the current active event',
    };
  }

  const [updateResult] = await pool.execute(
    'UPDATE guests SET is_attended = 1, attended_at = NOW() WHERE uuid = ? AND is_attended = 0',
    [uuid]
  );

  const checkInGuest = {
    full_name: guest.full_name,
    organization: guest.organization || null,
  };

  if (updateResult.affectedRows === 0) {
    return {
      status: 'already_checked_in',
      message: 'Already Checked In',
      guest: checkInGuest,
    };
  }

  return {
    status: 'success',
    message: `Welcome ${guest.full_name}`,
    guest: checkInGuest,
  };
}

async function getGuestAssetsForAdmin(guestId) {
  const guest = await getGuestById(guestId);
  if (!guest) return null;

  const event = await eventService.getEventById(guest.event_id);
  if (!event) return null;

  const hadQr = fileExists(guest.qr_code_path);
  const hadPdf = fileExists(guest.invitation_pdf_path);

  const ensured = await ensureGuestAssets(guest, event);

  return {
    guest: ensured,
    qr_path: ensured.qr_code_path,
    invitation_path: ensured.invitation_pdf_path || ensured.invitation_path,
    regenerated: {
      qr: !hadQr,
      invitation: !hadPdf,
    },
  };
}

async function updateGuestAttendance(guestId, isAttended) {
  const guest = await getGuestById(guestId);
  if (!guest) return null;

  if (isAttended) {
    await pool.execute(
      'UPDATE guests SET is_attended = 1, attended_at = NOW() WHERE id = ?',
      [guestId]
    );
  } else {
    await pool.execute(
      'UPDATE guests SET is_attended = 0, attended_at = NULL WHERE id = ?',
      [guestId]
    );
  }

  return getGuestById(guestId);
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

async function deleteGuest(id) {
  const guest = await getGuestById(id);
  if (!guest) return false;

  await pool.execute('DELETE FROM guests WHERE id = ?', [id]);
  deleteGuestAssetFiles(guest);
  return true;
}

async function getDashboardStats() {
  const [guestStats] = await pool.execute(`
    SELECT
      COUNT(*) as total_guests,
      COALESCE(SUM(is_attended), 0) as total_attended,
      COUNT(*) - COALESCE(SUM(is_attended), 0) as total_pending
    FROM guests
  `);

  const [eventCount] = await pool.execute('SELECT COUNT(*) as count FROM events');

  const activeEvent = await eventService.getActiveEvent();
  let activeEventStats = null;

  if (activeEvent) {
    const [activeGuests] = await pool.execute(
      `SELECT
        COUNT(*) as total_guests,
        COALESCE(SUM(is_attended), 0) as total_attended,
        COUNT(*) - COALESCE(SUM(is_attended), 0) as total_pending
       FROM guests WHERE event_id = ?`,
      [activeEvent.id]
    );
    activeEventStats = {
      event_id: activeEvent.id,
      title: activeEvent.title,
      status: activeEvent.status || 'active',
      total_guests: Number(activeGuests[0].total_guests) || 0,
      total_attended: Number(activeGuests[0].total_attended) || 0,
      total_pending: Number(activeGuests[0].total_pending) || 0,
    };
  }

  return {
    total_guests: Number(guestStats[0].total_guests) || 0,
    total_attended: Number(guestStats[0].total_attended) || 0,
    total_pending: Number(guestStats[0].total_pending) || 0,
    total_events: Number(eventCount[0].count) || 0,
    has_active_event: Boolean(activeEvent),
    active_event: activeEventStats,
  };
}

module.exports = {
  normalizeEmail,
  normalizePhone,
  findExistingGuestForEvent,
  getGuestByUuid,
  getGuestSuccessByUuid,
  getGuestById,
  getGuestsByEvent,
  getAllGuests,
  registerGuest,
  getGuestAssetsForAdmin,
  updateGuestAttendance,
  checkInGuest,
  markAttendance,
  deleteGuest,
  getDashboardStats,
  DUPLICATE_MESSAGE,
};

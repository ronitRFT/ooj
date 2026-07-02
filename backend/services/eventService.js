const { pool } = require('../config/db');
const { generateEventRegistrationQr } = require('../utils/eventQr');
const { DEFAULT_THEME } = require('../utils/eventTheme');
const {
  deleteUploadFile,
  deleteEventImageFiles,
  deleteGuestAssetFiles,
  copyEventImageFiles,
} = require('../utils/fileStorage');
const {
  applyClearableOptionalFields,
  validateThemeColors,
  CLEARABLE_OPTIONAL_FIELDS,
} = require('../utils/eventValidator');

const EVENT_FIELDS = [
  'title', 'subtitle', 'description', 'venue', 'event_date',
  'host_name', 'yogi_name', 'about_yogi', 'about_foundation',
  'banner_image', 'logo_image', 'rsvp_contact', 'invitation_text',
  'theme_primary', 'theme_secondary', 'theme_accent', 'status',
];

function combineDateTime(eventDate, eventTime) {
  if (!eventDate) return null;
  const time = eventTime || '00:00';
  return `${eventDate} ${time.length === 5 ? `${time}:00` : time}`;
}

function parseEventPayload(body, files = {}) {
  const data = {};

  EVENT_FIELDS.forEach((field) => {
    if (CLEARABLE_OPTIONAL_FIELDS.has(field)) return;
    if (body[field] !== undefined && body[field] !== '') {
      data[field] = body[field];
    }
  });

  applyClearableOptionalFields(data, body);

  if (body.event_date && body.event_time) {
    data.event_date = combineDateTime(body.event_date, body.event_time);
  } else if (body.event_date) {
    data.event_date = body.event_date.includes('T')
      ? body.event_date.replace('T', ' ').slice(0, 19)
      : combineDateTime(body.event_date, body.event_time || '00:00');
  }

  if (files.banner?.[0]) {
    data.banner_image = `/uploads/banners/${files.banner[0].filename}`;
  }
  if (files.logo?.[0]) {
    data.logo_image = `/uploads/logos/${files.logo[0].filename}`;
  }

  validateThemeColors(data);

  return data;
}

function buildEventUpdateAssignments(data) {
  const columns = [
    'title', 'subtitle', 'description', 'venue', 'event_date',
    'host_name', 'yogi_name', 'about_yogi', 'about_foundation',
    'banner_image', 'logo_image', 'rsvp_contact', 'invitation_text',
    'theme_primary', 'theme_secondary', 'theme_accent', 'status',
  ];

  const assignments = [];
  const values = [];

  columns.forEach((column) => {
    if (data[column] !== undefined) {
      assignments.push(`${column} = ?`);
      values.push(data[column]);
    }
  });

  return { assignments, values };
}

function cleanupUploadedFiles(...paths) {
  paths.filter(Boolean).forEach((filePath) => deleteUploadFile(filePath));
}

async function getActiveEvent() {
  const [rows] = await pool.execute(
    "SELECT * FROM events WHERE status = 'active' ORDER BY updated_at DESC LIMIT 1"
  );
  return rows[0] || null;
}

function assertCanActivate(event) {
  if (event.status === 'archived') {
    throw new Error('Archived events cannot be activated. Duplicate the event to create a new draft.');
  }
  if (event.status === 'completed') {
    throw new Error('Completed events cannot be activated. Duplicate the event to create a new draft.');
  }
}

function assertCanArchive(event) {
  if (event.status === 'active') {
    throw new Error('Cannot archive the active event. Set another event as active first.');
  }
}

function assertCanDelete(event) {
  if (event.status === 'active') {
    throw new Error('Cannot delete the active event. Activate another event first.');
  }
}

function assertCanDemoteActiveEvent(existing, nextStatus) {
  if (
    existing.status === 'active'
    && (nextStatus === 'draft' || nextStatus === 'completed')
  ) {
    throw new Error(
      'Cannot change the active event to draft or completed. Activate another event first.'
    );
  }
}

async function getEventById(id) {
  const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
  return rows[0] || null;
}

async function getAllEvents(includeArchived = true) {
  const query = includeArchived
    ? 'SELECT * FROM events ORDER BY event_date DESC'
    : "SELECT * FROM events WHERE status != 'archived' ORDER BY event_date DESC";
  const [rows] = await pool.execute(query);
  return rows;
}

async function activateEventWithConnection(connection, id) {
  const [targetRows] = await connection.execute(
    'SELECT id, status FROM events WHERE id = ? FOR UPDATE',
    [id]
  );
  if (!targetRows[0]) {
    throw new Error('Event not found');
  }

  assertCanActivate(targetRows[0]);

  const [activeRows] = await connection.execute(
    "SELECT id FROM events WHERE status = 'active' FOR UPDATE"
  );
  const otherActive = activeRows.filter((row) => row.id !== Number(id));

  if (otherActive.length > 0) {
    await connection.execute(
      "UPDATE events SET status = 'completed' WHERE status = 'active' AND id != ?",
      [id]
    );
  }

  await connection.execute("UPDATE events SET status = 'active' WHERE id = ?", [id]);
}

async function createEvent(body, files = {}) {
  const data = parseEventPayload(body, files);

  if (!data.title || !data.venue || !data.event_date) {
    throw new Error('Title, venue, and date are required');
  }

  const wantActive = data.status === 'active';
  const initialStatus = wantActive ? 'draft' : (data.status || 'draft');

  if (initialStatus === 'archived' || initialStatus === 'completed') {
    throw new Error('New events must be created as draft or active');
  }

  data.status = initialStatus;

  const connection = await pool.getConnection();
  let insertId;

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO events (
        title, subtitle, description, venue, event_date,
        host_name, yogi_name, about_yogi, about_foundation,
        banner_image, logo_image, rsvp_contact, invitation_text,
        theme_primary, theme_secondary, theme_accent, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.subtitle || null,
        data.description || null,
        data.venue,
        data.event_date,
        data.host_name || null,
        data.yogi_name || null,
        data.about_yogi || null,
        data.about_foundation || null,
        data.banner_image || null,
        data.logo_image || null,
        data.rsvp_contact || null,
        data.invitation_text || null,
        data.theme_primary || DEFAULT_THEME.theme_primary,
        data.theme_secondary || DEFAULT_THEME.theme_secondary,
        data.theme_accent || DEFAULT_THEME.theme_accent,
        data.status,
      ]
    );

    insertId = result.insertId;

    if (wantActive) {
      await activateEventWithConnection(connection, insertId);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    cleanupUploadedFiles(data.banner_image, data.logo_image);
    throw error;
  } finally {
    connection.release();
  }

  if (wantActive) {
    await generateEventRegistrationQr();
  }

  return getEventById(insertId);
}

async function updateEvent(id, body, files = {}) {
  const existing = await getEventById(id);
  if (!existing) return null;

  if (body.status === 'archived') {
    assertCanArchive(existing);
  }
  if (body.status === 'active') {
    assertCanActivate(existing);
  }
  if (body.status) {
    assertCanDemoteActiveEvent(existing, body.status);
  }

  const data = parseEventPayload(body, files);
  const activatingViaStatus = body.status === 'active';
  if (activatingViaStatus) {
    delete data.status;
  }

  const { assignments, values } = buildEventUpdateAssignments(data);
  if (!assignments.length && !activatingViaStatus) {
    return existing;
  }

  const oldBanner = existing.banner_image;
  const oldLogo = existing.logo_image;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (assignments.length) {
      await connection.execute(
        `UPDATE events SET ${assignments.join(', ')} WHERE id = ?`,
        [...values, id]
      );
    }

    if (activatingViaStatus) {
      await activateEventWithConnection(connection, id);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    cleanupUploadedFiles(data.banner_image, data.logo_image);
    throw error;
  } finally {
    connection.release();
  }

  if (data.banner_image && oldBanner && oldBanner !== data.banner_image) {
    deleteUploadFile(oldBanner);
  }
  if (data.logo_image && oldLogo && oldLogo !== data.logo_image) {
    deleteUploadFile(oldLogo);
  }

  if (activatingViaStatus) {
    await generateEventRegistrationQr();
  }

  return getEventById(id);
}

async function setActiveEvent(id) {
  const event = await getEventById(id);
  if (!event) throw new Error('Event not found');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await activateEventWithConnection(connection, id);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  await generateEventRegistrationQr();

  return getEventById(id);
}

async function archiveEvent(id) {
  const event = await getEventById(id);
  if (!event) return null;

  assertCanArchive(event);

  await pool.execute("UPDATE events SET status = 'archived' WHERE id = ?", [id]);
  return getEventById(id);
}

async function deleteEvent(id) {
  const event = await getEventById(id);
  if (!event) return false;

  assertCanDelete(event);

  const [guestRows] = await pool.execute(
    'SELECT qr_code_path, invitation_path, invitation_pdf_path FROM guests WHERE event_id = ?',
    [id]
  );

  await pool.execute('DELETE FROM events WHERE id = ?', [id]);

  guestRows.forEach((guest) => deleteGuestAssetFiles(guest));
  deleteEventImageFiles(event);

  return true;
}

async function duplicateEvent(id) {
  const event = await getEventById(id);
  if (!event) return null;

  const copiedImages = copyEventImageFiles(event);

  try {
    const [result] = await pool.execute(
      `INSERT INTO events (
        title, subtitle, description, venue, event_date,
        host_name, yogi_name, about_yogi, about_foundation,
        banner_image, logo_image, rsvp_contact, invitation_text,
        theme_primary, theme_secondary, theme_accent, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        `${event.title} (Copy)`,
        event.subtitle,
        event.description,
        event.venue,
        event.event_date,
        event.host_name,
        event.yogi_name,
        event.about_yogi,
        event.about_foundation,
        copiedImages.banner_image,
        copiedImages.logo_image,
        event.rsvp_contact,
        event.invitation_text,
        event.theme_primary,
        event.theme_secondary,
        event.theme_accent,
      ]
    );

    return getEventById(result.insertId);
  } catch (error) {
    cleanupUploadedFiles(copiedImages.banner_image, copiedImages.logo_image);
    throw error;
  }
}

async function getRegistrationQrInfo(regenerate = false) {
  const event = await getActiveEvent();
  const qr = regenerate
    ? await generateEventRegistrationQr()
    : await require('../utils/eventQr').ensureEventRegistrationQr();

  return {
    qr_path: qr.qrPath,
    registration_url: qr.registrationUrl,
    event,
    has_active_event: Boolean(event),
  };
}

module.exports = {
  getActiveEvent,
  getEventById,
  getAllEvents,
  createEvent,
  updateEvent,
  setActiveEvent,
  archiveEvent,
  deleteEvent,
  duplicateEvent,
  getRegistrationQrInfo,
  parseEventPayload,
};

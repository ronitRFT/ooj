const { pool } = require('../config/db');
const {
  ensureEventRegistrationQr,
  generateEventRegistrationQr,
  getRegistrationUrl,
  getEventQrPublicPath,
} = require('../utils/eventQr');

async function getActiveEvent() {
  const [rows] = await pool.execute(
    'SELECT * FROM events WHERE is_active = 1 ORDER BY event_date ASC LIMIT 1'
  );
  return rows[0] || null;
}

async function getEventById(id) {
  const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
  return rows[0] || null;
}

async function getAllEvents() {
  const [rows] = await pool.execute('SELECT * FROM events ORDER BY event_date DESC');
  return rows;
}

async function createEvent(data) {
  const { title, description, venue, event_date, banner_image } = data;
  const [result] = await pool.execute(
    'INSERT INTO events (title, description, venue, event_date, banner_image) VALUES (?, ?, ?, ?, ?)',
    [title, description, venue, event_date, banner_image || null]
  );
  return getEventById(result.insertId);
}

async function updateEvent(id, data) {
  const { title, description, venue, event_date, banner_image, is_active } = data;
  await pool.execute(
    `UPDATE events SET title = ?, description = ?, venue = ?, event_date = ?,
     banner_image = COALESCE(?, banner_image), is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [title, description, venue, event_date, banner_image, is_active, id]
  );
  return getEventById(id);
}

async function getRegistrationQrInfo(regenerate = false) {
  const event = await getActiveEvent();
  const qr = regenerate
    ? await generateEventRegistrationQr()
    : await ensureEventRegistrationQr();

  return {
    qr_path: qr.qrPath,
    registration_url: qr.registrationUrl,
    event,
  };
}

module.exports = {
  getActiveEvent,
  getEventById,
  getAllEvents,
  createEvent,
  updateEvent,
  getRegistrationQrInfo,
  getRegistrationUrl,
  getEventQrPublicPath,
};

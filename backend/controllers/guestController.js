const guestService = require('../services/guestService');
const eventService = require('../services/eventService');
const { extractUuidFromRequest } = require('../utils/qrDecoder');

async function registerGuest(req, res) {
  try {
    const { event_id, full_name, email, phone, organization } = req.body;

    if (!event_id || !full_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Event ID, full name, and email are required',
      });
    }

    const event = await eventService.getEventById(event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const guest = await guestService.registerGuest(req.body, event);
    res.status(201).json({
      success: true,
      message: guest.email_sent
        ? 'Registration successful! Check your email for the invitation PDF.'
        : 'Registration successful! Download your invitation below.',
      data: guest,
    });
  } catch (error) {
    const status = error.message.includes('already registered') ? 409 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
}

async function getGuestByUuid(req, res) {
  try {
    const guest = await guestService.getGuestByUuid(req.params.uuid);
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }
    res.json({ success: true, data: guest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getAllGuests(req, res) {
  try {
    const guests = await guestService.getAllGuests();
    res.json({ success: true, data: guests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getGuestsByEvent(req, res) {
  try {
    const guests = await guestService.getGuestsByEvent(req.params.eventId);
    res.json({ success: true, data: guests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function checkIn(req, res) {
  try {
    const uuid = extractUuidFromRequest(req.body);

    if (!uuid) {
      return res.status(400).json({
        success: false,
        status: 'invalid_guest',
        message: 'Invalid Guest',
      });
    }

    const result = await guestService.checkInGuest(uuid);

    if (result.status === 'success') {
      return res.json({
        success: true,
        status: result.status,
        message: result.message,
        data: result.guest,
      });
    }

    if (result.status === 'already_checked_in') {
      return res.status(409).json({
        success: false,
        status: result.status,
        message: result.message,
        data: result.guest,
      });
    }

    return res.status(404).json({
      success: false,
      status: result.status,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Check-in failed' });
  }
}

async function getDashboardStats(req, res) {
  try {
    const stats = await guestService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  registerGuest,
  getGuestByUuid,
  getAllGuests,
  getGuestsByEvent,
  checkIn,
  getDashboardStats,
};

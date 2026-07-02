const eventService = require('../services/eventService');

async function getActiveEvent(req, res) {
  try {
    const event = await eventService.getActiveEvent();
    if (!event) {
      return res.status(404).json({ success: false, message: 'No active event found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getAllEvents(req, res) {
  try {
    const events = await eventService.getAllEvents();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getEventById(req, res) {
  try {
    const event = await eventService.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function createEvent(req, res) {
  try {
    const { title, description, venue, event_date } = req.body;
    if (!title || !venue || !event_date) {
      return res.status(400).json({ success: false, message: 'Title, venue, and event_date are required' });
    }
    const event = await eventService.createEvent(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function updateEvent(req, res) {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getRegistrationQr(req, res) {
  try {
    const info = await eventService.getRegistrationQrInfo();
    if (!info.event) {
      return res.status(404).json({ success: false, message: 'No active event found' });
    }
    res.json({
      success: true,
      data: {
        qr_path: info.qr_path,
        registration_url: info.registration_url,
        event: {
          id: info.event.id,
          title: info.event.title,
          venue: info.event.venue,
          event_date: info.event.event_date,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getActiveEvent,
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  getRegistrationQr,
};

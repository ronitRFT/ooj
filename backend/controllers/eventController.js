const eventService = require('../services/eventService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendInternalError } = require('../utils/safeError');

function businessRuleStatus(message) {
  if (
    message.includes('cannot be activated')
    || message.includes('Cannot archive')
    || message.includes('Cannot delete the active event')
    || message.includes('Cannot change the active event')
    || message.includes('Only one event can be active')
    || message.includes('must be a valid hex color')
    || message.includes('images are allowed')
    || message.includes('mime type')
    || message.includes('New events must be created')
  ) {
    return 400;
  }
  return null;
}

async function getActiveEvent(req, res) {
  try {
    const event = await eventService.getActiveEvent();
    if (!event) {
      return sendError(res, 404, { message: 'No active event found' });
    }
    return sendSuccess(res, 200, { data: event });
  } catch (error) {
    return sendInternalError(res, 'getActiveEvent', error);
  }
}

async function getAllEvents(req, res) {
  try {
    const events = await eventService.getAllEvents();
    return sendSuccess(res, 200, { data: events });
  } catch (error) {
    return sendInternalError(res, 'getAllEvents', error);
  }
}

async function getEventById(req, res) {
  try {
    const event = await eventService.getEventById(req.params.id);
    if (!event) {
      return sendError(res, 404, { message: 'Event not found' });
    }
    return sendSuccess(res, 200, { data: event });
  } catch (error) {
    return sendInternalError(res, 'getEventById', error);
  }
}

async function createEvent(req, res) {
  try {
    const event = await eventService.createEvent(req.body, req.files);
    return sendSuccess(res, 201, { data: event });
  } catch (error) {
    const status = businessRuleStatus(error.message)
      || (error.message.includes('required') ? 400 : 500);
    if (status === 400) {
      return sendError(res, status, { message: error.message });
    }
    return sendInternalError(res, 'createEvent', error, 'Failed to create event');
  }
}

async function updateEvent(req, res) {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body, req.files);
    if (!event) {
      return sendError(res, 404, { message: 'Event not found' });
    }
    return sendSuccess(res, 200, { data: event });
  } catch (error) {
    const status = businessRuleStatus(error.message);
    if (status === 400) {
      return sendError(res, status, { message: error.message });
    }
    return sendInternalError(res, 'updateEvent', error, 'Failed to update event');
  }
}

async function setActiveEvent(req, res) {
  try {
    const event = await eventService.setActiveEvent(req.params.id);
    return sendSuccess(res, 200, {
      message: 'Event set as active',
      data: event,
    });
  } catch (error) {
    const status = error.message.includes('not found')
      ? 404
      : (businessRuleStatus(error.message) || 500);
    if (status === 404 || status === 400) {
      return sendError(res, status, { message: error.message });
    }
    return sendInternalError(res, 'setActiveEvent', error, 'Failed to activate event');
  }
}

async function archiveEvent(req, res) {
  try {
    const event = await eventService.archiveEvent(req.params.id);
    if (!event) {
      return sendError(res, 404, { message: 'Event not found' });
    }
    return sendSuccess(res, 200, {
      message: 'Event archived',
      data: event,
    });
  } catch (error) {
    const status = businessRuleStatus(error.message);
    if (status === 400) {
      return sendError(res, status, { message: error.message });
    }
    return sendInternalError(res, 'archiveEvent', error, 'Failed to archive event');
  }
}

async function duplicateEvent(req, res) {
  try {
    const event = await eventService.duplicateEvent(req.params.id);
    if (!event) {
      return sendError(res, 404, { message: 'Event not found' });
    }
    return sendSuccess(res, 201, {
      message: 'Event duplicated',
      data: event,
    });
  } catch (error) {
    return sendInternalError(res, 'duplicateEvent', error, 'Failed to duplicate event');
  }
}

async function deleteEvent(req, res) {
  try {
    const deleted = await eventService.deleteEvent(req.params.id);
    if (!deleted) {
      return sendError(res, 404, { message: 'Event not found' });
    }
    return sendSuccess(res, 200, { message: 'Event deleted' });
  } catch (error) {
    const status = businessRuleStatus(error.message);
    if (status === 400) {
      return sendError(res, status, { message: error.message });
    }
    return sendInternalError(res, 'deleteEvent', error, 'Failed to delete event');
  }
}

async function getRegistrationQr(req, res) {
  try {
    const info = await eventService.getRegistrationQrInfo();
    return sendSuccess(res, 200, {
      data: {
        qr_path: info.qr_path,
        registration_url: info.registration_url,
        event: info.event,
        has_active_event: info.has_active_event,
      },
      message: info.has_active_event
        ? null
        : 'No active event. Set an event to Active in Events CMS to enable public registration.',
    });
  } catch (error) {
    return sendInternalError(res, 'getRegistrationQr', error);
  }
}

module.exports = {
  getActiveEvent,
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  setActiveEvent,
  archiveEvent,
  duplicateEvent,
  deleteEvent,
  getRegistrationQr,
};

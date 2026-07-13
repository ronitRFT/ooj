const guestService = require('../services/guestService');
const eventService = require('../services/eventService');
const { extractUuidFromRequest } = require('../utils/qrDecoder');
const { validateEmail } = require('../utils/emailValidator');
const { validatePhone, normalizePhoneForStorage } = require('../utils/phoneValidator');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendInternalError } = require('../utils/safeError');
const { sendUploadFile } = require('../utils/serveAsset');

function guestQrUrl(uuid) {
  return `/guests/uuid/${uuid}/qr`;
}

function guestInvitationUrl(uuid) {
  return `/guests/uuid/${uuid}/invitation`;
}

function adminGuestQrUrl(id) {
  return `/admin/guests/${id}/qr`;
}

function adminGuestInvitationUrl(id) {
  return `/admin/guests/${id}/invitation`;
}

async function registerGuest(req, res) {
  try {
    const { full_name, email, phone, organization } = req.body;

    if (!full_name?.trim() || !email) {
      const errors = {};
      if (!full_name?.trim()) errors.full_name = 'Full name is required';
      if (!email) errors.email = 'Email address is required';
      return sendError(res, 400, {
        message: 'Full name and email are required',
        errors,
      });
    }

    if (full_name.trim().length > 255) {
      return sendError(res, 400, {
        message: 'Full name must be 255 characters or less',
        errors: { full_name: 'Full name must be 255 characters or less' },
      });
    }

    if (organization && String(organization).trim().length > 255) {
      return sendError(res, 400, {
        message: 'Organization must be 255 characters or less',
        errors: { organization: 'Organization must be 255 characters or less' },
      });
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return sendError(res, 400, {
        message: emailCheck.error,
        errors: { email: emailCheck.error },
      });
    }

    let normalizedPhone = null;
    if (phone && String(phone).trim()) {
      const phoneCheck = validatePhone(phone);
      if (!phoneCheck.valid) {
        return sendError(res, 400, {
          message: phoneCheck.error,
          errors: { phone: phoneCheck.error },
        });
      }
      normalizedPhone = normalizePhoneForStorage(phoneCheck.phone);
    }

    const event = await eventService.getActiveEvent();
    if (!event || event.status !== 'active') {
      return sendError(res, 404, { message: 'No active event available for registration' });
    }

    const result = await guestService.registerGuest({
      event_id: event.id,
      full_name: full_name.trim(),
      email: emailCheck.email,
      phone: normalizedPhone,
      organization: organization?.trim() || null,
    }, event);

    const statusCode = result.already_registered ? 200 : 201;
    const guest = result.guest;

    return sendSuccess(res, statusCode, {
      message: result.message,
      data: {
        ...guest,
        qr_url: guestQrUrl(guest.uuid),
        invitation_url: guestInvitationUrl(guest.uuid),
        already_registered: result.already_registered,
      },
    });
  } catch (error) {
    const status = error.message?.includes('required') || error.message?.includes('valid')
      ? 400
      : 500;
    if (status === 400) {
      const payload = { message: error.message || 'Registration failed' };
      if (error.message?.includes('phone')) {
        payload.errors = { phone: error.message };
      }
      return sendError(res, status, payload);
    }
    return sendInternalError(res, 'registerGuest', error, 'Registration failed');
  }
}

async function getGuestByUuid(req, res) {
  try {
    const guest = await guestService.getGuestByUuid(req.params.uuid);
    if (!guest) {
      return sendError(res, 404, { message: 'Guest not found' });
    }
    return sendSuccess(res, 200, {
      data: {
        full_name: guest.full_name,
        attendance_status: guest.is_attended ? 'checked_in' : 'not_checked_in',
        qr_exists: Boolean(guest.qr_code_path),
        invitation_exists: Boolean(guest.invitation_pdf_path || guest.invitation_path),
      },
    });
  } catch (error) {
    return sendInternalError(res, 'getGuestByUuid', error);
  }
}

async function getGuestSuccessByUuid(req, res) {
  try {
    const result = await guestService.getGuestSuccessByUuid(req.params.uuid);
    if (!result) {
      return sendError(res, 404, { message: 'Guest not found' });
    }

    const { guest, event } = result;
    return sendSuccess(res, 200, {
      data: {
        guest: {
          uuid: guest.uuid,
          full_name: guest.full_name,
          organization: guest.organization,
          qr_url: guestQrUrl(guest.uuid),
          invitation_url: guestInvitationUrl(guest.uuid),
          attendance_status: guest.is_attended ? 'checked_in' : 'not_checked_in',
        },
        event,
      },
    });
  } catch (error) {
    return sendInternalError(res, 'getGuestSuccessByUuid', error);
  }
}

async function serveGuestAsset(req, res, type) {
  try {
    const result = await guestService.getGuestSuccessByUuid(req.params.uuid);
    if (!result) {
      return sendError(res, 404, { message: 'Guest not found' });
    }

    const { guest } = result;
    const assetPath = type === 'qr'
      ? guest.qr_code_path
      : (guest.invitation_pdf_path || guest.invitation_path);

    if (!assetPath) {
      return sendError(res, 404, { message: 'Asset not found' });
    }

    const downloadName = type === 'qr'
      ? `qr-${guest.uuid}.png`
      : `invitation-${guest.full_name.replace(/\s+/g, '-')}.pdf`;

    const sent = sendUploadFile(res, assetPath, { downloadName, inline: true });
    if (!sent) {
      return sendError(res, 404, { message: 'Asset not found' });
    }
    return undefined;
  } catch (error) {
    return sendInternalError(res, `serveGuestAsset:${type}`, error);
  }
}

async function getGuestQrAsset(req, res) {
  return serveGuestAsset(req, res, 'qr');
}

async function getGuestInvitationAsset(req, res) {
  return serveGuestAsset(req, res, 'invitation');
}

async function serveAdminGuestAsset(req, res, type) {
  try {
    const result = await guestService.getGuestAssetsForAdmin(req.params.id);
    if (!result) {
      return sendError(res, 404, { message: 'Guest not found' });
    }

    const assetPath = type === 'qr'
      ? result.qr_path
      : result.invitation_path;

    if (!assetPath) {
      return sendError(res, 404, { message: 'Asset not found' });
    }

    const downloadName = type === 'qr'
      ? `qr-${result.guest.uuid}.png`
      : `invitation-${result.guest.full_name.replace(/\s+/g, '-')}.pdf`;

    const sent = sendUploadFile(res, assetPath, { downloadName, inline: true });
    if (!sent) {
      return sendError(res, 404, { message: 'Asset not found' });
    }
    return undefined;
  } catch (error) {
    return sendInternalError(res, `serveAdminGuestAsset:${type}`, error);
  }
}

async function getAdminGuestQrAsset(req, res) {
  return serveAdminGuestAsset(req, res, 'qr');
}

async function getAdminGuestInvitationAsset(req, res) {
  return serveAdminGuestAsset(req, res, 'invitation');
}

async function getAllGuests(req, res) {
  try {
    const guests = await guestService.getAllGuests();
    return sendSuccess(res, 200, { data: guests });
  } catch (error) {
    return sendInternalError(res, 'getAllGuests', error);
  }
}

async function getGuestsByEvent(req, res) {
  try {
    const guests = await guestService.getGuestsByEvent(req.params.eventId);
    return sendSuccess(res, 200, { data: guests });
  } catch (error) {
    return sendInternalError(res, 'getGuestsByEvent', error);
  }
}

async function getGuestAssets(req, res) {
  try {
    const result = await guestService.getGuestAssetsForAdmin(req.params.id);
    if (!result) {
      return sendError(res, 404, { message: 'Guest not found' });
    }
    return sendSuccess(res, 200, {
      data: {
        guest: result.guest,
        qr_url: adminGuestQrUrl(req.params.id),
        invitation_url: adminGuestInvitationUrl(req.params.id),
        regenerated: result.regenerated,
      },
    });
  } catch (error) {
    return sendInternalError(res, 'getGuestAssets', error);
  }
}

async function updateGuestAttendance(req, res) {
  try {
    const { is_attended: isAttended } = req.body;
    if (typeof isAttended !== 'boolean') {
      return sendError(res, 400, { message: 'is_attended must be a boolean' });
    }

    const guest = await guestService.updateGuestAttendance(req.params.id, isAttended);
    if (!guest) {
      return sendError(res, 404, { message: 'Guest not found' });
    }

    return sendSuccess(res, 200, {
      message: isAttended ? 'Guest marked as checked in' : 'Guest attendance cleared',
      data: guest,
    });
  } catch (error) {
    return sendInternalError(res, 'updateGuestAttendance', error);
  }
}

async function checkIn(req, res) {
  try {
    const uuid = extractUuidFromRequest(req.body);

    if (!uuid) {
      return sendError(res, 400, {
        message: 'Invalid QR code format',
        data: { status: 'invalid_format' },
      });
    }

    const result = await guestService.checkInGuest(uuid);

    if (result.status === 'success') {
      return sendSuccess(res, 200, {
        message: result.message,
        data: { status: result.status, guest: result.guest },
      });
    }

    if (result.status === 'already_checked_in') {
      return sendError(res, 409, {
        message: result.message,
        data: { status: result.status, guest: result.guest },
      });
    }

    if (result.status === 'expired_event') {
      return sendError(res, 403, {
        message: result.message,
        data: { status: result.status },
      });
    }

    return sendError(res, 404, {
      message: result.message,
      data: { status: result.status },
    });
  } catch (error) {
    return sendInternalError(res, 'checkIn', error, 'Check-in failed');
  }
}

async function getDashboardStats(req, res) {
  try {
    const stats = await guestService.getDashboardStats();
    return sendSuccess(res, 200, { data: stats });
  } catch (error) {
    return sendInternalError(res, 'getDashboardStats', error);
  }
}

module.exports = {
  registerGuest,
  getGuestByUuid,
  getGuestSuccessByUuid,
  getGuestQrAsset,
  getGuestInvitationAsset,
  getAdminGuestQrAsset,
  getAdminGuestInvitationAsset,
  getAllGuests,
  getGuestsByEvent,
  getGuestAssets,
  updateGuestAttendance,
  checkIn,
  getDashboardStats,
};

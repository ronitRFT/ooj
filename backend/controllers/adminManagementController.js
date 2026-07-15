const adminService = require('../services/adminService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendInternalError } = require('../utils/safeError');

function handleServiceError(res, error, context) {
  if (error instanceof adminService.AdminServiceError) {
    return sendError(res, error.status, { message: error.message });
  }
  return sendInternalError(res, context, error);
}

async function listAdmins(req, res) {
  try {
    const admins = await adminService.listAdmins();
    return sendSuccess(res, 200, { data: admins });
  } catch (error) {
    return handleServiceError(res, error, 'listAdmins');
  }
}

async function getAdmin(req, res) {
  try {
    const admin = await adminService.getAdminById(req.params.id);
    if (!admin) {
      return sendError(res, 404, { message: 'Admin not found' });
    }
    return sendSuccess(res, 200, { data: admin });
  } catch (error) {
    return handleServiceError(res, error, 'getAdmin');
  }
}

async function createAdmin(req, res) {
  try {
    const { username, password, role } = req.body;
    const admin = await adminService.createAdmin({ username, password, role });
    return sendSuccess(res, 201, { message: 'Admin created', data: admin });
  } catch (error) {
    return handleServiceError(res, error, 'createAdmin');
  }
}

async function updateAdmin(req, res) {
  try {
    const { username, role } = req.body;
    const admin = await adminService.updateAdmin(req.params.id, { username, role });
    return sendSuccess(res, 200, { message: 'Admin updated', data: admin });
  } catch (error) {
    return handleServiceError(res, error, 'updateAdmin');
  }
}

async function resetPassword(req, res) {
  try {
    const { password } = req.body;
    await adminService.resetPassword(req.params.id, password);
    return sendSuccess(res, 200, { message: 'Password reset' });
  } catch (error) {
    return handleServiceError(res, error, 'resetPassword');
  }
}

async function deleteAdmin(req, res) {
  try {
    await adminService.deleteAdmin(req.params.id, req.admin?.id);
    return sendSuccess(res, 200, { message: 'Admin deleted' });
  } catch (error) {
    return handleServiceError(res, error, 'deleteAdmin');
  }
}

module.exports = {
  listAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  resetPassword,
  deleteAdmin,
};

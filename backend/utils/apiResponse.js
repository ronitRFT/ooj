function apiResponse({ success, message = null, errors = null, data = null }) {
  return { success, message, errors, data };
}

function sendSuccess(res, status = 200, { message = null, errors = null, data = null } = {}) {
  return res.status(status).json(apiResponse({ success: true, message, errors, data }));
}

function sendError(res, status = 500, { message = 'Internal server error', errors = null, data = null } = {}) {
  return res.status(status).json(apiResponse({ success: false, message, errors, data }));
}

module.exports = {
  apiResponse,
  sendSuccess,
  sendError,
};

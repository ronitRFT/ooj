const { sendError } = require('./apiResponse');

function logServerError(context, error) {
  const message = error?.stack || error?.message || String(error);
  console.error(`[${context}]`, message);
}

function sendSafeError(res, status, { message, errors = null, data = null }, context, error) {
  if (status >= 500 && error) {
    logServerError(context, error);
  }
  return sendError(res, status, { message, errors, data });
}

function sendInternalError(res, context, error, message = 'Internal server error') {
  logServerError(context, error);
  return sendError(res, 500, { message });
}

module.exports = {
  logServerError,
  sendSafeError,
  sendInternalError,
};

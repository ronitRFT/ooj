const { sendError } = require('../utils/apiResponse');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateUuidParam(req, res, next) {
  const { uuid } = req.params;
  if (!uuid || !UUID_REGEX.test(uuid)) {
    return sendError(res, 400, { message: 'Invalid guest identifier' });
  }
  return next();
}

module.exports = { validateUuidParam, UUID_REGEX };

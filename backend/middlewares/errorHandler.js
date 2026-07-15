const { sendError } = require('../utils/apiResponse');

function errorHandler(err, req, res, next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 400, { message: 'File too large. Max 5MB.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
    return sendError(res, 400, { message: 'Invalid upload field or too many files' });
  }
  if (err.message?.includes('image files')
    || err.message?.includes('images are allowed')
    || err.message?.includes('mime type')
    || err.message?.includes('CSV files are allowed')
    || err.message?.includes('File too large')) {
    return sendError(res, 400, { message: err.message });
  }
  console.error(err.stack || err.message);
  return sendError(res, err.status || 500, {
    message: err.message || 'Internal server error',
  });
}

function notFound(req, res) {
  return sendError(res, 404, { message: 'Route not found' });
}

module.exports = { errorHandler, notFound };

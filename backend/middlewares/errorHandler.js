function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

module.exports = { errorHandler, notFound };

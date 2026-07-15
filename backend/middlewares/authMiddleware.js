const { verifyAuth } = require('../controllers/authController');
const { sendError } = require('../utils/apiResponse');

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.admin?.role;
    if (!role) {
      return sendError(res, 401, { message: 'Unauthorized' });
    }
    if (!allowedRoles.includes(role)) {
      return sendError(res, 403, { message: 'You do not have permission to perform this action' });
    }
    return next();
  };
}

module.exports = { verifyAuth, requireRole };

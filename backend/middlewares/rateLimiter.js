const rateLimit = require('express-rate-limit');
const { apiResponse } = require('../utils/apiResponse');

const isDev = process.env.NODE_ENV !== 'production';
const rateLimitsEnabled = process.env.RATE_LIMIT_ENABLED === 'true' || !isDev;

function createLimiter(max, message) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !rateLimitsEnabled,
    message: apiResponse({ success: false, message, errors: null, data: null }),
  });
}

const loginLimiter = createLimiter(5, 'Too many login attempts. Please try again in 15 minutes.');
const registerLimiter = createLimiter(20, 'Too many registration attempts. Please try again in 15 minutes.');
const checkInLimiter = createLimiter(60, 'Too many check-in attempts. Please try again in 15 minutes.');

module.exports = {
  loginLimiter,
  registerLimiter,
  checkInLimiter,
};

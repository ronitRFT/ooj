const jwt = require('jsonwebtoken');

const JWT_EXPIRES_IN = '24h';
const WEAK_JWT_SECRETS = new Set([
  'change_this_secret_in_production',
  'secret',
  'jwt_secret',
]);

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || !String(secret).trim()) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

function assertJwtSecretConfigured() {
  const secret = getJwtSecret();
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  if (process.env.NODE_ENV === 'production' && WEAK_JWT_SECRETS.has(secret.toLowerCase())) {
    throw new Error('JWT_SECRET must be changed from the default value in production');
  }
}

function generateToken(payload = {}) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function parseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7).trim();
}

module.exports = {
  generateToken,
  verifyToken,
  parseToken,
  assertJwtSecretConfigured,
};

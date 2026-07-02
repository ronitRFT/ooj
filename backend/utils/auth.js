const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_EXPIRES_IN = '24h';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || !String(secret).trim()) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

function assertJwtSecretConfigured() {
  getJwtSecret();
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
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
  hashPassword,
  generateToken,
  verifyToken,
  parseToken,
  assertJwtSecretConfigured,
};

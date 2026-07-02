const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { generateToken, parseToken, verifyToken } = require('../utils/auth');
const { sendSuccess, sendError } = require('../utils/apiResponse');

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return sendError(res, 400, { message: 'Username and password required' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, password_hash FROM admins WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return sendError(res, 401, { message: 'Invalid credentials' });
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return sendError(res, 401, { message: 'Invalid credentials' });
    }

    const token = generateToken({
      id: admin.id,
      username: admin.username,
      role: 'admin',
    });

    return sendSuccess(res, 200, {
      data: { token, username: admin.username },
    });
  } catch (error) {
    return sendError(res, 500, { message: 'Login failed' });
  }
}

function logout(req, res) {
  return sendSuccess(res, 200, { message: 'Logged out' });
}

function verifyAuth(req, res, next) {
  const token = parseToken(req.headers.authorization);

  if (!token) {
    return sendError(res, 401, { message: 'Unauthorized' });
  }

  try {
    const decoded = verifyToken(token);

    if (decoded.role !== 'admin') {
      return sendError(res, 403, { message: 'Forbidden' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return sendError(res, 401, {
      message: error.name === 'TokenExpiredError' ? 'Session expired' : 'Unauthorized',
    });
  }
}

module.exports = { login, logout, verifyAuth };

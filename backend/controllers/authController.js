const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { generateToken, parseToken, verifyToken } = require('../utils/auth');

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, password_hash FROM admins WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken({
      id: admin.id,
      username: admin.username,
      role: 'admin',
    });

    res.json({ success: true, data: { token, username: admin.username } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
}

function logout(req, res) {
  res.json({ success: true, message: 'Logged out' });
}

function verifyAuth(req, res, next) {
  const token = parseToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const decoded = verifyToken(token);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Session expired' : 'Unauthorized',
    });
  }
}

module.exports = { login, logout, verifyAuth };

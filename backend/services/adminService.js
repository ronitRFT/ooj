const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { ROLES, isValidRole } = require('../utils/roles');

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

class AdminServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'AdminServiceError';
  }
}

function normalizeUsername(username) {
  return typeof username === 'string' ? username.trim() : '';
}

function toPublicAdmin(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    created_at: row.created_at,
  };
}

async function listAdmins() {
  const [rows] = await pool.execute(
    'SELECT id, username, role, created_at FROM admins ORDER BY id ASC'
  );
  return rows.map(toPublicAdmin);
}

async function getAdminById(id) {
  const [rows] = await pool.execute(
    'SELECT id, username, role, created_at FROM admins WHERE id = ?',
    [id]
  );
  return rows[0] ? toPublicAdmin(rows[0]) : null;
}

async function countSuperAdmins(excludeId = null) {
  const [rows] = excludeId
    ? await pool.execute(
      "SELECT COUNT(*) AS count FROM admins WHERE role = 'super_admin' AND id <> ?",
      [excludeId]
    )
    : await pool.execute("SELECT COUNT(*) AS count FROM admins WHERE role = 'super_admin'");
  return Number(rows[0].count) || 0;
}

function validateNewAdminInput({ username, password, role }) {
  const cleanUsername = normalizeUsername(username);
  if (!cleanUsername) {
    throw new AdminServiceError(400, 'Username is required');
  }
  if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
    throw new AdminServiceError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!isValidRole(role)) {
    throw new AdminServiceError(400, 'Invalid role');
  }
  return { cleanUsername, role };
}

async function createAdmin({ username, password, role = ROLES.ADMIN }) {
  const { cleanUsername } = validateNewAdminInput({ username, password, role });

  const [existing] = await pool.execute(
    'SELECT id FROM admins WHERE username = ?',
    [cleanUsername]
  );
  if (existing.length > 0) {
    throw new AdminServiceError(409, 'Username already exists');
  }

  const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
  const [result] = await pool.execute(
    'INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)',
    [cleanUsername, passwordHash, role]
  );

  return getAdminById(result.insertId);
}

async function updateAdmin(id, { username, role }) {
  const admin = await getAdminById(id);
  if (!admin) {
    throw new AdminServiceError(404, 'Admin not found');
  }

  const updates = [];
  const params = [];

  if (username !== undefined) {
    const cleanUsername = normalizeUsername(username);
    if (!cleanUsername) {
      throw new AdminServiceError(400, 'Username cannot be empty');
    }
    const [existing] = await pool.execute(
      'SELECT id FROM admins WHERE username = ? AND id <> ?',
      [cleanUsername, id]
    );
    if (existing.length > 0) {
      throw new AdminServiceError(409, 'Username already exists');
    }
    updates.push('username = ?');
    params.push(cleanUsername);
  }

  if (role !== undefined) {
    if (!isValidRole(role)) {
      throw new AdminServiceError(400, 'Invalid role');
    }
    // Prevent demoting the last super_admin.
    if (admin.role === ROLES.SUPER_ADMIN && role !== ROLES.SUPER_ADMIN) {
      const remaining = await countSuperAdmins(id);
      if (remaining === 0) {
        throw new AdminServiceError(409, 'Cannot demote the last super admin');
      }
    }
    updates.push('role = ?');
    params.push(role);
  }

  if (updates.length === 0) {
    return admin;
  }

  params.push(id);
  await pool.execute(`UPDATE admins SET ${updates.join(', ')} WHERE id = ?`, params);
  return getAdminById(id);
}

async function resetPassword(id, password) {
  const admin = await getAdminById(id);
  if (!admin) {
    throw new AdminServiceError(404, 'Admin not found');
  }
  if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
    throw new AdminServiceError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
  await pool.execute('UPDATE admins SET password_hash = ? WHERE id = ?', [passwordHash, id]);
  return admin;
}

async function deleteAdmin(id, requestingAdminId) {
  const admin = await getAdminById(id);
  if (!admin) {
    throw new AdminServiceError(404, 'Admin not found');
  }
  if (Number(id) === Number(requestingAdminId)) {
    throw new AdminServiceError(409, 'You cannot delete your own account');
  }
  if (admin.role === ROLES.SUPER_ADMIN) {
    const remaining = await countSuperAdmins(id);
    if (remaining === 0) {
      throw new AdminServiceError(409, 'Cannot delete the last super admin');
    }
  }

  await pool.execute('DELETE FROM admins WHERE id = ?', [id]);
  return true;
}

module.exports = {
  AdminServiceError,
  listAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  resetPassword,
  deleteAdmin,
  MIN_PASSWORD_LENGTH,
};

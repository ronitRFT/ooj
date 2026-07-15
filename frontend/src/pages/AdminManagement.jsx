import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { ROLES, getStoredAdminId } from '../utils/adminAuth';
import './AdminManagement.css';

const ROLE_OPTIONS = [
  { value: ROLES.SUPER_ADMIN, label: 'Super Admin' },
  { value: ROLES.ADMIN, label: 'Admin' },
  { value: ROLES.VOLUNTEER, label: 'Volunteer' },
];

const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.VOLUNTEER]: 'Volunteer',
};

const EMPTY_CREATE = { username: '', password: '', role: ROLES.ADMIN };

function errorMessage(err, fallback) {
  return err?.response?.data?.message || fallback;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [resetFor, setResetFor] = useState(null);
  const [resetPassword, setResetPassword] = useState('');

  const currentId = getStoredAdminId();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminAPI.listAdmins();
      setAdmins(data.data || []);
    } catch (err) {
      setError(errorMessage(err, 'Failed to load admins'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (message) => {
    setNotice(message);
    setError('');
    window.setTimeout(() => setNotice(''), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminAPI.createAdmin(createForm);
      setCreateForm(EMPTY_CREATE);
      setCreateOpen(false);
      flash('Admin created');
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Failed to create admin'));
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (admin, role) => {
    if (role === admin.role) return;
    setError('');
    try {
      await adminAPI.updateAdmin(admin.id, { role });
      flash(`${admin.username} is now ${ROLE_LABELS[role]}`);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Failed to update role'));
      await load();
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminAPI.resetAdminPassword(resetFor.id, resetPassword);
      setResetFor(null);
      setResetPassword('');
      flash('Password reset');
    } catch (err) {
      setError(errorMessage(err, 'Failed to reset password'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (admin) => {
    if (!window.confirm(`Delete admin "${admin.username}"? This cannot be undone.`)) {
      return;
    }
    setError('');
    try {
      await adminAPI.deleteAdmin(admin.id);
      flash('Admin deleted');
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Failed to delete admin'));
    }
  };

  return (
    <div className="admin-mgmt">
      <div className="admin-mgmt-header">
        <div>
          <h1>Admin Management</h1>
          <p className="admin-mgmt-subtitle">Manage administrator and volunteer accounts.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => { setCreateOpen((v) => !v); setError(''); }}
        >
          {createOpen ? 'Cancel' : '+ Add Admin'}
        </button>
      </div>

      {notice && <div className="admin-mgmt-notice" role="status">{notice}</div>}
      {error && <div className="admin-mgmt-error" role="alert">{error}</div>}

      {createOpen && (
        <form className="admin-mgmt-card admin-mgmt-form" onSubmit={handleCreate}>
          <h2>New Account</h2>
          <div className="admin-mgmt-form-row">
            <label>
              Username
              <input
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                required
                autoComplete="off"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <label>
              Role
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      )}

      <div className="admin-mgmt-card">
        {loading ? (
          <p className="admin-mgmt-empty">Loading...</p>
        ) : admins.length === 0 ? (
          <p className="admin-mgmt-empty">No admins found.</p>
        ) : (
          <div className="admin-mgmt-table-wrap">
            <table className="admin-mgmt-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isSelf = Number(admin.id) === Number(currentId);
                  return (
                    <tr key={admin.id}>
                      <td data-label="Username">
                        {admin.username}
                        {isSelf && <span className="admin-mgmt-you">You</span>}
                      </td>
                      <td data-label="Role">
                        <select
                          className="admin-mgmt-role-select"
                          value={admin.role}
                          onChange={(e) => handleRoleChange(admin, e.target.value)}
                        >
                          {ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Created">
                        {admin.created_at
                          ? new Date(admin.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="admin-mgmt-actions" data-label="Actions">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => { setResetFor(admin); setResetPassword(''); setError(''); }}
                        >
                          Reset Password
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDelete(admin)}
                          disabled={isSelf}
                          title={isSelf ? 'You cannot delete your own account' : 'Delete admin'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resetFor && (
        <div className="admin-mgmt-modal-backdrop" role="dialog" aria-modal="true">
          <form className="admin-mgmt-modal" onSubmit={handleResetSubmit}>
            <h2>Reset Password</h2>
            <p>Set a new password for <strong>{resetFor.username}</strong>.</p>
            <input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <div className="admin-mgmt-modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setResetFor(null); setResetPassword(''); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Saving...' : 'Save Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

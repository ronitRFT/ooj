import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';

export default function GuestEditModal({ guest, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    organization: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (guest) {
      setForm({
        full_name: guest.full_name || '',
        email: guest.email || '',
        phone: guest.phone || '',
        organization: guest.organization || '',
      });
      setError('');
    }
  }, [guest]);

  useEffect(() => {
    if (!guest) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [guest, onClose]);

  if (!guest) return null;

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { data } = await adminAPI.updateGuest(guest.id, {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        organization: form.organization.trim(),
      });
      onSaved(data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update guest');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gm-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="gm-modal gm-modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gm-edit-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="gm-modal-header">
          <h3 id="gm-edit-modal-title">Edit Guest</h3>
          <p>Update this guest&apos;s details. The invitation is re-generated if the name changes.</p>
        </header>

        {error && <p className="gm-modal-error" role="alert">{error}</p>}

        <form className="gm-form" onSubmit={handleSubmit}>
          <div className="gm-form-group">
            <label htmlFor="edit-full-name">Full name</label>
            <input
              id="edit-full-name"
              type="text"
              value={form.full_name}
              onChange={setField('full_name')}
              maxLength={255}
              required
            />
          </div>
          <div className="gm-form-group">
            <label htmlFor="edit-email">Email</label>
            <input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={setField('email')}
              required
            />
          </div>
          <div className="gm-form-group">
            <label htmlFor="edit-phone">Phone</label>
            <input
              id="edit-phone"
              type="tel"
              value={form.phone}
              onChange={setField('phone')}
              placeholder="Optional"
            />
          </div>
          <div className="gm-form-group">
            <label htmlFor="edit-organization">Organization</label>
            <input
              id="edit-organization"
              type="text"
              value={form.organization}
              onChange={setField('organization')}
              maxLength={255}
              placeholder="Optional"
            />
          </div>

          <div className="gm-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

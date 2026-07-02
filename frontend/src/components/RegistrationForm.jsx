import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { guestAPI } from '../services/api';
import { validateEmail, validatePhone, validateRegistrationForm } from '../utils/validation';
import './RegistrationForm.css';

const FIELD_KEYS = ['full_name', 'email', 'phone', 'organization'];

function applyServerFieldErrors(apiErrors, setFieldErrors, setTouched) {
  if (!apiErrors || typeof apiErrors !== 'object') return false;

  const nextErrors = {};
  FIELD_KEYS.forEach((key) => {
    if (apiErrors[key]) nextErrors[key] = apiErrors[key];
  });

  if (Object.keys(nextErrors).length === 0) return false;

  setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
  setTouched((prev) => ({
    ...prev,
    ...Object.fromEntries(Object.keys(nextErrors).map((key) => [key, true])),
  }));
  return true;
}

export default function RegistrationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    organization: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateField = (name, value, nextForm) => {
    const data = nextForm || { ...form, [name]: value };
    if (name === 'email') {
      const result = validateEmail(value);
      return result.valid ? '' : result.error;
    }
    if (name === 'phone') {
      if (!value || !String(value).trim()) return '';
      const result = validatePhone(value);
      return result.valid ? '' : result.error;
    }
    if (name === 'full_name') {
      return data.full_name?.trim() ? '' : 'Full name is required';
    }
    if (name === 'organization') {
      if (value && String(value).trim().length > 255) {
        return 'Organization must be 255 characters or less';
      }
      return '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    setError('');
    if (touched[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value, nextForm) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const formValidation = validateRegistrationForm(form);
  const canSubmit = formValidation.valid && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ full_name: true, email: true, phone: true, organization: true });

    const validation = validateRegistrationForm(form);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await guestAPI.register({
        full_name: validation.normalized.full_name,
        email: validation.normalized.email,
        phone: validation.normalized.phone,
        organization: form.organization.trim() || null,
      });

      const alreadyRegistered = data.data?.already_registered;
      navigate(`/success/${data.data.uuid}`, {
        state: {
          alreadyRegistered,
          message: alreadyRegistered ? 'You are already registered.' : data.message,
        },
      });
    } catch (err) {
      const applied = applyServerFieldErrors(
        err.response?.data?.errors,
        setFieldErrors,
        setTouched,
      );
      if (!applied) {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="registration-form" onSubmit={handleSubmit} noValidate>
      <h2>Your Details</h2>
      <p className="form-subtitle">Complete the form to receive your invitation</p>

      {error && <div className="form-error">{error}</div>}

      <div className={`form-group ${fieldErrors.full_name ? 'has-error' : ''}`}>
        <label htmlFor="full_name">Full Name *</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          value={form.full_name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Your full name"
          aria-invalid={Boolean(fieldErrors.full_name)}
        />
        {fieldErrors.full_name && (
          <span className="field-error">{fieldErrors.full_name}</span>
        )}
      </div>

      <div className={`form-group ${fieldErrors.email ? 'has-error' : ''}`}>
        <label htmlFor="email">Email Address *</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="your@email.com"
          aria-invalid={Boolean(fieldErrors.email)}
        />
        {fieldErrors.email && (
          <span className="field-error">{fieldErrors.email}</span>
        )}
      </div>

      <div className={`form-group ${fieldErrors.phone ? 'has-error' : ''}`}>
        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="10–15 digits (optional)"
          aria-invalid={Boolean(fieldErrors.phone)}
        />
        {fieldErrors.phone && (
          <span className="field-error">{fieldErrors.phone}</span>
        )}
      </div>

      <div className={`form-group ${fieldErrors.organization ? 'has-error' : ''}`}>
        <label htmlFor="organization">Organization</label>
        <input
          id="organization"
          name="organization"
          type="text"
          value={form.organization}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Optional"
          aria-invalid={Boolean(fieldErrors.organization)}
        />
        {fieldErrors.organization && (
          <span className="field-error">{fieldErrors.organization}</span>
        )}
      </div>

      <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
        {loading ? 'Registering...' : 'Register & Receive Invitation'}
      </button>
    </form>
  );
}

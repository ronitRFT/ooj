import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { guestAPI } from '../services/api';
import './RegistrationForm.css';

export default function RegistrationForm({ event }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    organization: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await guestAPI.register({
        event_id: event.id,
        ...form,
      });
      navigate('/success', { state: { guest: data.data } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="registration-form" onSubmit={handleSubmit}>
      <h2>Guest Registration</h2>
      <p className="form-subtitle">Register for {event.title}</p>

      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="full_name">Full Name *</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          value={form.full_name}
          onChange={handleChange}
          required
          placeholder="John Doe"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email Address *</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="john@example.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <div className="form-group">
        <label htmlFor="organization">Organization</label>
        <input
          id="organization"
          name="organization"
          type="text"
          value={form.organization}
          onChange={handleChange}
          placeholder="Company or institution"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Registering...' : 'Register & Get QR Code'}
      </button>
    </form>
  );
}

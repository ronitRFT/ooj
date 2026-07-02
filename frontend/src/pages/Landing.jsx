import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventAPI } from '../services/api';
import './Landing.css';

export default function Landing() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    eventAPI.getActive()
      .then(({ data }) => setEvent(data.data))
      .catch(() => setError('Unable to load event details'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page-center"><div className="loader">Loading event...</div></div>;
  }

  if (error || !event) {
    return (
      <div className="page-center">
        <div className="error-box">{error || 'No active event found'}</div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">Upcoming Event</span>
          <h1>{event.title}</h1>
          <p className="hero-description">{event.description}</p>
          <div className="hero-details">
            <div className="detail-item">
              <span className="detail-icon">📅</span>
              <div>
                <strong>Date & Time</strong>
                <p>{eventDate}</p>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">📍</span>
              <div>
                <strong>Venue</strong>
                <p>{event.venue}</p>
              </div>
            </div>
          </div>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Register Now</Link>
            <Link to="/scanner" className="btn btn-secondary btn-lg">Check-In Scanner</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

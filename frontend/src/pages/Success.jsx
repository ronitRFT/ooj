import { useEffect, useState } from 'react';
import { useParams, useLocation, Link, Navigate } from 'react-router-dom';
import { guestAPI } from '../services/api';
import {
  getEventThemeStyle,
  resolveEventAssets,
  resolveEventCopy,
} from '../utils/eventTheme';
import QRDisplay from '../components/QRDisplay';
import './Success.css';

export default function Success() {
  const { uuid } = useParams();
  const location = useLocation();
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const alreadyRegistered = location.state?.alreadyRegistered;
  const message = location.state?.message;

  useEffect(() => {
    if (!uuid) return;

    guestAPI.getSuccessByUuid(uuid)
      .then(({ data }) => {
        setGuest(data.data.guest);
        setEvent(data.data.event);
      })
      .catch(() => {
        setError('Unable to load your registration details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [uuid]);

  if (!uuid) {
    return <Navigate to="/register" replace />;
  }

  if (loading) {
    return <div className="page-center"><div className="loader">Loading invitation...</div></div>;
  }

  if (error || !guest || !event) {
    return (
      <div className="page-center">
        <div className="error-box">{error || 'Registration not found.'}</div>
        <Link to="/register" className="back-link">← Register for the event</Link>
      </div>
    );
  }

  const themeStyle = getEventThemeStyle(event);
  const copy = resolveEventCopy(event);
  const assets = resolveEventAssets(event);

  return (
    <div className="success-page event-themed" style={themeStyle}>
      <div className="success-inner fade-in-up">
        <QRDisplay
          guest={guest}
          event={event}
          copy={copy}
          assets={assets}
          alreadyRegistered={alreadyRegistered}
          noticeMessage={message}
        />
        <Link to="/" className="back-link">← Return to Home</Link>
      </div>
    </div>
  );
}

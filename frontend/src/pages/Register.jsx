import { useActiveEvent } from '../context/ActiveEventContext';
import RegistrationForm from '../components/RegistrationForm';
import './Register.css';

function QrIllustration() {
  return (
    <div className="register-qr-illustration" aria-hidden="true">
      <div className="register-qr-grid">
        {Array.from({ length: 36 }).map((_, i) => (
          <span key={i} className={i % 4 === 0 ? 'filled' : ''} />
        ))}
      </div>
    </div>
  );
}

export default function Register() {
  const { event, loading, error, assets, copy } = useActiveEvent();

  if (loading) {
    return <div className="page-center"><div className="loader">Loading registration...</div></div>;
  }

  if (error || !event) {
    return (
      <div className="page-center">
        <div className="error-box">{error || 'No event available for registration'}</div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="register-page">
      <div className="register-card fade-in-up">
        <div className="register-summary">
          {assets.bannerUrl ? (
            <div className="register-banner-wrap">
              <img src={assets.bannerUrl} alt="" className="register-banner" />
            </div>
          ) : (
            <div className="register-banner-fallback" />
          )}
          <div className="register-summary-body">
            {assets.logoUrl && (
              <img src={assets.logoUrl} alt={copy.brand_name} className="register-logo" />
            )}
            <span className="section-label">Event Registration</span>
            <h1>{copy.title}</h1>
            {copy.subtitle && <p className="register-subtitle">{copy.subtitle}</p>}
            <div className="register-meta">
              <span>📅 {eventDate}</span>
              <span>📍 {event.venue}</span>
            </div>
            {copy.yogi_name && (
              <p className="register-yogi">Guest of Honor: {copy.yogi_name}</p>
            )}
            {copy.invitation_text && (
              <p className="register-invitation">{copy.invitation_text}</p>
            )}
          </div>
          <QrIllustration />
        </div>
        <RegistrationForm />
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useActiveEvent } from '../context/ActiveEventContext';
import './Landing.css';

function QrIllustration() {
  return (
    <div className="qr-illustration" aria-hidden="true">
      <div className="qr-illustration-inner">
        {Array.from({ length: 49 }).map((_, i) => (
          <span key={i} className={i % 3 === 0 || i % 7 === 0 ? 'filled' : ''} />
        ))}
      </div>
      <div className="qr-illustration-corner tl" />
      <div className="qr-illustration-corner tr" />
      <div className="qr-illustration-corner bl" />
    </div>
  );
}

export default function Landing() {
  const { event, loading, error, assets, copy } = useActiveEvent();

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
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const registrationUrl = `${window.location.origin}/register?event=active`;

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="hero-banner">
          {assets.bannerUrl ? (
            <img src={assets.bannerUrl} alt={copy.title} className="hero-banner-img" />
          ) : (
            <div className="hero-banner-fallback" />
          )}
          <div className="hero-overlay" />
        </div>
        <div className="hero-content fade-in-up">
          {assets.logoUrl && (
            <img src={assets.logoUrl} alt={copy.brand_name} className="hero-logo" />
          )}
          {copy.subtitle && <span className="hero-subtitle">{copy.subtitle}</span>}
          <h1 className="hero-title">{copy.title}</h1>
          {copy.description && <p className="hero-tagline">{copy.description}</p>}
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Register Now</Link>
            <a href="#rsvp" className="btn btn-secondary btn-lg">Scan QR</a>
          </div>
        </div>
      </section>

      <div className="landing-sections">
        <section className="landing-section fade-in-up fade-in-delay-1">
          <div className="section-inner">
            <span className="section-label">Our Mission</span>
            <h2 className="section-title">About {copy.host_name}</h2>
            <p className="section-desc">{copy.about_foundation}</p>
          </div>
        </section>

        <section className="landing-section section-alt fade-in-up fade-in-delay-2">
          <div className="section-inner section-split">
            <div className="section-text">
              <span className="section-label">Guest of Honor</span>
              <h2 className="section-title">About {copy.yogi_name}</h2>
              <p className="section-desc">{copy.about_yogi}</p>
            </div>
            <div className="yogi-card card">
              {assets.logoUrl ? (
                <img src={assets.logoUrl} alt="" className="yogi-card-logo" />
              ) : (
                <div className="yogi-card-icon">🙏</div>
              )}
              <h3>{copy.yogi_name}</h3>
              {copy.host_name && <p className="yogi-card-host">Hosted by {copy.host_name}</p>}
            </div>
          </div>
        </section>

        <section className="landing-section fade-in-up fade-in-delay-2">
          <div className="section-inner">
            <span className="section-label">Gathering Details</span>
            <h2 className="section-title">Event Details</h2>
            <div className="details-grid">
              <div className="detail-card card">
                <span className="detail-icon">📅</span>
                <h3>Date & Time</h3>
                <p>{eventDate}</p>
              </div>
              <div className="detail-card card">
                <span className="detail-icon">📍</span>
                <h3>Venue</h3>
                <p>{event.venue}</p>
              </div>
              {copy.host_name && (
                <div className="detail-card card">
                  <span className="detail-icon">🏛️</span>
                  <h3>Host</h3>
                  <p>{copy.host_name}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="landing-section section-alt">
          <div className="section-inner">
            <span className="section-label">Purpose</span>
            <h2 className="section-title">Why Attend</h2>
            <p className="section-desc section-invitation">{copy.invitation_text}</p>
          </div>
        </section>

        <section id="rsvp" className="landing-section section-rsvp">
          <div className="section-inner">
            <div className="rsvp-card card">
              <div className="rsvp-content">
                <span className="section-label">Join Us</span>
                <h2 className="section-title">RSVP</h2>
                <p className="section-desc">{copy.rsvp_description}</p>
                {copy.rsvp_contact && (
                  <p className="rsvp-contact">
                    <strong>Contact:</strong> {copy.rsvp_contact}
                  </p>
                )}
                <div className="rsvp-actions">
                  <Link to="/register" className="btn btn-primary btn-lg">Register Now</Link>
                </div>
              </div>
              <div className="rsvp-qr-wrap">
                <QrIllustration />
                <p className="rsvp-qr-label">Scan to Register</p>
                <code className="rsvp-url">{registrationUrl}</code>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

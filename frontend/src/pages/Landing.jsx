import { useEffect, useRef } from 'react';
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
  const detailsRef = useRef(null);
  const rsvpRef = useRef(null);

  useEffect(() => {
    const els = [detailsRef.current, rsvpRef.current].filter(Boolean);
    if (!els.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [event]);

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
        <div className="hero-split">
          <div className="hero-content">
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
          <div className="hero-media">
            <img
              src={assets.bannerUrl || '/hero-side.png'}
              alt={copy.title}
              className="hero-media-img"
            />
            <div className="hero-media-glow" aria-hidden="true" />
            <div className="hero-media-caption">
              <span className="hero-media-name">योगी प्रियव्रत अनिमेष</span>
              <span className="hero-media-sub">नमो नारायण</span>
            </div>
          </div>
        </div>
      </section>

      <div className="landing-sections">
        <section className="landing-section section-philosophy fade-in-up fade-in-delay-1">
          <div className="philosophy-split">
            <div className="philosophy-media">
              <img src="/image.png" alt={copy.host_name} className="philosophy-media-img" />
            </div>
            <div className="philosophy-content">
              <h2 className="section-title">
                The Guiding Philosophy of<br />Yogi Priyavrat Animesh
              </h2>
              <p className="philosophy-subtitle">In Light, In Balance, In Being</p>
              <p className="section-desc">
                What is the purpose of life? How does the vibrancy of youth define the arc of
                one’s existence in this vast cosmos? The answers do not reside in the noise of the
                outer world, but in the silence within. They dwell in the presence of a Guru—one
                who sees not only the seen, but also the unseen; one who aligns the seeker with
                their eternal truth.
              </p>
              <p className="section-desc">
                Yogi Priyavrat Animesh’s spiritual path emerged from a profound recognition: that
                the hearts of the youth often beat under the weight of confusion, insecurity, and
                silent longing. His journeys across forests, riversides, highlands, and remote
                hermitages have not only connected him with the elemental truths of nature, but
                also brought him closer to the questions that trouble the modern mind.
              </p>
              <p className="section-desc">
                With compassion as his compass and clarity as his method, Yogi Animesh offers a
                path where contrary forces within can be harmonised—through tapasya (discipline),
                swadhyaya (self-study), and prana niyantran (channelisation of vital energies).
                While these practices point to transcendental truths, they also ease the modern
                burdens of anxiety, distraction, and emotional unrest.
              </p>
              <p className="section-desc">
                His philosophy is inclusive—open to all who seek, all who suffer, and all who dare
                to ask deeper questions. In his presence, even the weary spirit remembers how to
                breathe in peace once again.
              </p>
            </div>
          </div>
        </section>

        <section ref={detailsRef} className="landing-section section-details">
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

        <section id="rsvp" ref={rsvpRef} className="landing-section section-rsvp">
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

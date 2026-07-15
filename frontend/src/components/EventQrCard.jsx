import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getUploadUrl } from '../services/api';
import { downloadFileAsBlob } from '../utils/download';
import './EventQrCard.css';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return true;
  }
}

export default function EventQrCard({ qrData }) {
  const [copyFeedback, setCopyFeedback] = useState('');
  const [downloading, setDownloading] = useState(false);

  const qrUrl = getUploadUrl(qrData.qr_path);
  const registrationUrl = qrData.registration_url;
  const event = qrData.event;
  const hasActiveEvent = qrData.has_active_event !== false && Boolean(event);

  const showCopySuccess = (key) => {
    setCopyFeedback(key);
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleDownload = async () => {
    if (!qrUrl) return;
    setDownloading(true);
    try {
      await downloadFileAsBlob(qrUrl, 'ooj-event-registration-qr.png');
    } catch {
      window.alert('Download failed. Try copying the registration link instead.');
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const title = event?.title ? `Register for ${event.title}!` : 'Register for our event!';
    const message = `${title}\n\nScan the QR code or visit:\n${registrationUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    await copyText(registrationUrl);
    showCopySuccess('link');
  };

  const handleCopyWhatsApp = async () => {
    const title = event?.title ? `Register for ${event.title}!` : 'Register for our event!';
    const message = `${title}\n\nScan the QR code or visit:\n${registrationUrl}`;
    await copyText(`https://wa.me/?text=${encodeURIComponent(message)}`);
    showCopySuccess('whatsapp');
  };

  const handleCopyQrUrl = async () => {
    if (!qrUrl) return;
    await copyText(qrUrl);
    showCopySuccess('qr');
  };

  const eventDate = event?.event_date
    ? new Date(event.event_date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : null;

  return (
    <section className="event-qr-card" aria-labelledby="event-qr-heading">
      <div className="event-qr-header">
        <div>
          <h2 id="event-qr-heading">Public Registration QR</h2>
          <p>Share on WhatsApp, print on posters, or display on banners</p>
        </div>
      </div>

      <div className="event-qr-body">
        <div className="event-qr-image-wrap">
          {qrUrl && (
            <img
              src={qrUrl}
              alt={`Registration QR code${event?.title ? ` for ${event.title}` : ''}`}
              className="event-qr-image"
            />
          )}
          <p className="event-qr-scan-hint">Guests scan → register → receive personal check-in QR</p>
        </div>

        <div className="event-qr-details">
          {hasActiveEvent ? (
            <>
              <h3>{event.title}</h3>
              {eventDate && <p className="event-qr-meta">{eventDate}</p>}
              {event.venue && <p className="event-qr-meta">{event.venue}</p>}
            </>
          ) : (
            <div className="event-qr-empty">
              <h3>No active event</h3>
              <p className="event-qr-meta">
                Create an event and set it to <strong>Active</strong> to enable public registration.
              </p>
              <Link to="/admin/events" className="btn btn-outline btn-sm">Go to Events CMS</Link>
            </div>
          )}

          <div className="event-qr-url">
            <label htmlFor="event-registration-url">Registration Link</label>
            <code id="event-registration-url">{registrationUrl}</code>
          </div>

          <div className="event-qr-actions">
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-primary"
              disabled={!qrUrl || downloading}
            >
              {downloading ? 'Downloading…' : 'Download Event QR'}
            </button>
            <button type="button" onClick={handleWhatsAppShare} className="btn btn-secondary">
              Share on WhatsApp
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="btn btn-secondary"
              aria-live="polite"
            >
              {copyFeedback === 'link' ? 'Copied successfully' : 'Copy Link'}
            </button>
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="btn btn-secondary"
              aria-live="polite"
            >
              {copyFeedback === 'whatsapp' ? 'Copied successfully' : 'Copy WhatsApp'}
            </button>
            <button
              type="button"
              onClick={handleCopyQrUrl}
              className="btn btn-secondary"
              disabled={!qrUrl}
              aria-live="polite"
            >
              {copyFeedback === 'qr' ? 'Copied successfully' : 'Copy Event QR'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

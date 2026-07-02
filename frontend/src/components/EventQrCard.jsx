import { getUploadUrl } from '../services/api';
import './EventQrCard.css';

export default function EventQrCard({ qrData }) {
  const qrUrl = getUploadUrl(qrData.qr_path);
  const registrationUrl = qrData.registration_url;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = 'ooj-event-registration-qr.png';
    link.click();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Register for ${qrData.event.title}!\n\nScan the QR code or visit:\n${registrationUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = registrationUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
  };

  const eventDate = new Date(qrData.event.event_date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section className="event-qr-card">
      <div className="event-qr-header">
        <div>
          <h2>Public Registration QR</h2>
          <p>Share on WhatsApp, print on posters, or display on banners</p>
        </div>
      </div>

      <div className="event-qr-body">
        <div className="event-qr-image-wrap">
          {qrUrl && (
            <img src={qrUrl} alt="Event Registration QR Code" className="event-qr-image" />
          )}
          <p className="event-qr-scan-hint">Guests scan → register → get personal invitation QR</p>
        </div>

        <div className="event-qr-details">
          <h3>{qrData.event.title}</h3>
          <p className="event-qr-meta">{eventDate}</p>
          <p className="event-qr-meta">{qrData.event.venue}</p>

          <div className="event-qr-url">
            <label>Registration Link</label>
            <code>{registrationUrl}</code>
          </div>

          <div className="event-qr-actions">
            <button type="button" onClick={handleDownload} className="btn btn-primary">
              Download Event QR
            </button>
            <button type="button" onClick={handleWhatsAppShare} className="btn btn-secondary">
              Share on WhatsApp
            </button>
            <button type="button" onClick={handleCopyLink} className="btn btn-secondary">
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

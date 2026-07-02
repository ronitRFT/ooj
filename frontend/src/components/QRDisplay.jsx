import { getUploadUrl } from '../services/api';
import './QRDisplay.css';

export default function QRDisplay({ guest, eventTitle }) {
  const qrUrl = getUploadUrl(guest.qr_code_path);
  const invitationUrl = getUploadUrl(
    guest.invitation_download_url || guest.invitation_pdf_path || guest.invitation_path
  );

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `qr-${guest.uuid}.png`;
    link.click();
  };

  const handleDownloadInvitation = () => {
    if (!invitationUrl) return;
    const link = document.createElement('a');
    link.href = invitationUrl;
    link.download = `invitation-${guest.full_name.replace(/\s+/g, '-')}.pdf`;
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="qr-display">
      <div className="qr-success-icon">✓</div>
      <h2>Registration Complete!</h2>
      <p className="qr-guest-name">{guest.full_name}</p>
      {eventTitle && <p className="qr-event">{eventTitle}</p>}

      {qrUrl && (
        <div className="qr-image-wrap">
          <img src={qrUrl} alt="Your QR Code" className="qr-image" />
        </div>
      )}

      <p className="qr-instruction">
        Present this QR code at the event entrance for check-in.
        {guest.email_sent !== false && ' Your invitation has been sent to your email.'}
      </p>

      <p className="qr-uuid">Guest ID: {guest.uuid}</p>

      <div className="download-actions">
        {invitationUrl && (
          <button onClick={handleDownloadInvitation} className="btn btn-primary">
            Download Invitation
          </button>
        )}
        <button onClick={handleDownloadQr} className="btn btn-secondary">
          Download QR Code
        </button>
      </div>
    </div>
  );
}

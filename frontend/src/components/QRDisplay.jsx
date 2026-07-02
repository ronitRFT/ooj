import { useState } from 'react';
import { getUploadUrl } from '../services/api';
import { downloadFileAsBlob } from '../utils/download';
import './QRDisplay.css';

export default function QRDisplay({
  guest,
  event,
  copy,
  assets,
  alreadyRegistered,
  noticeMessage,
}) {
  const [downloadError, setDownloadError] = useState('');
  const [downloading, setDownloading] = useState(null);

  const qrUrl = guest.qr_code_path ? getUploadUrl(guest.qr_code_path) : null;
  const invitationUrl = getUploadUrl(
    guest.invitation_download_url || guest.invitation_pdf_path || guest.invitation_path,
  );
  const eventTitle = copy?.title || event?.title;
  const invitationText = copy?.invitation_text;
  const bannerUrl = assets?.bannerUrl;
  const logoUrl = assets?.logoUrl;

  const handleDownload = async (url, filename, type) => {
    if (!url) return;
    setDownloadError('');
    setDownloading(type);
    try {
      await downloadFileAsBlob(url, filename);
    } catch {
      setDownloadError('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="qr-display">
      {bannerUrl && (
        <div className="qr-display-banner">
          <img src={bannerUrl} alt="" />
        </div>
      )}

      {alreadyRegistered && (
        <div className="qr-duplicate-notice" role="status">
          {noticeMessage || 'You are already registered.'}
        </div>
      )}

      <div className="qr-success-badge">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="qr-success-logo" />
        ) : (
          <span className="qr-success-icon">{alreadyRegistered ? '↩' : '✓'}</span>
        )}
        <div>
          <h2>{alreadyRegistered ? 'Welcome Back' : 'Registration Complete'}</h2>
          <p className="qr-guest-name">{guest.full_name}</p>
        </div>
      </div>

      {eventTitle && <p className="qr-event">{eventTitle}</p>}

      {invitationText && (
        <blockquote className="qr-invitation-text">{invitationText}</blockquote>
      )}

      {invitationUrl ? (
        <div className="invitation-preview card">
          <span className="preview-label">Your Invitation</span>
          <div className="preview-frame">
            <iframe
              src={invitationUrl}
              title="Invitation Preview"
              className="preview-iframe"
            />
          </div>
          <p className="preview-hint">Present your QR code at the venue for check-in</p>
        </div>
      ) : (
        <p className="qr-missing-notice">
          Your invitation PDF is not available yet. Please contact the event organizer.
        </p>
      )}

      {qrUrl ? (
        <div className="qr-code-section">
          <span className="preview-label">Check-In QR Code</span>
          <div className="qr-image-wrap">
            <img src={qrUrl} alt="Your QR Code" className="qr-image" />
          </div>
        </div>
      ) : (
        <p className="qr-missing-notice">
          Your check-in QR code is not available yet. Please contact the event organizer.
        </p>
      )}

      <p className="qr-instruction">
        {alreadyRegistered
          ? 'Your existing invitation and check-in QR are shown below.'
          : guest.email_sent !== false
            ? 'Your invitation has been sent to your email.'
            : 'Save your invitation and QR code below.'}
      </p>

      <p className="qr-uuid">Guest ID: {guest.uuid}</p>

      {downloadError && (
        <p className="qr-download-error" role="alert">{downloadError}</p>
      )}

      <div className="download-actions">
        {invitationUrl && (
          <button
            type="button"
            onClick={() => handleDownload(
              invitationUrl,
              `invitation-${guest.full_name.replace(/\s+/g, '-')}.pdf`,
              'pdf',
            )}
            className="btn btn-primary"
            disabled={downloading === 'pdf'}
          >
            {downloading === 'pdf' ? 'Downloading…' : 'Download Invitation PDF'}
          </button>
        )}
        {qrUrl && (
          <button
            type="button"
            onClick={() => handleDownload(qrUrl, `qr-${guest.uuid}.png`, 'qr')}
            className="btn btn-secondary"
            disabled={downloading === 'qr'}
          >
            {downloading === 'qr' ? 'Downloading…' : 'Download QR Code'}
          </button>
        )}
      </div>
    </div>
  );
}

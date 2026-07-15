import { useState, useEffect } from 'react';
import { getApiAssetUrl } from '../services/api';
import { downloadFileAsBlob, fetchAssetBlob, saveBlobAsDownload } from '../utils/download';
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
  const [downloadNotice, setDownloadNotice] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [invitationBlobUrl, setInvitationBlobUrl] = useState(null);
  const [invitationLoadError, setInvitationLoadError] = useState('');
  const [invitationBlob, setInvitationBlob] = useState(null);

  const qrUrl = getApiAssetUrl(guest.qr_url);
  const invitationUrl = getApiAssetUrl(guest.invitation_url);
  const eventTitle = copy?.title || event?.title;
  const invitationText = copy?.invitation_text;
  const bannerUrl = assets?.bannerUrl;
  const logoUrl = assets?.logoUrl;

  useEffect(() => {
    if (!invitationUrl) {
      setInvitationBlobUrl(null);
      setInvitationBlob(null);
      setInvitationLoadError('');
      return undefined;
    }

    let active = true;
    let blobUrl = null;

    setInvitationLoadError('');
    fetchAssetBlob(invitationUrl)
      .then(({ blob, contentType }) => {
        if (!active) return;
        if (!contentType.includes('pdf') && !blob.type.includes('pdf')) {
          throw new Error('Invalid invitation file type');
        }
        blobUrl = URL.createObjectURL(blob);
        setInvitationBlob(blob);
        setInvitationBlobUrl(blobUrl);
      })
      .catch(() => {
        if (active) {
          setInvitationLoadError('Unable to load invitation preview. Try downloading instead.');
          setInvitationBlobUrl(null);
          setInvitationBlob(null);
        }
      });

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [invitationUrl]);

  const handleDownloadInvitation = async () => {
    setDownloadError('');
    setDownloadNotice('');
    setDownloading('pdf');
    try {
      const filename = `invitation-${guest.full_name.replace(/\s+/g, '-')}.pdf`;
      if (invitationBlob) {
        saveBlobAsDownload(invitationBlob, filename);
      } else {
        const result = await downloadFileAsBlob(invitationUrl, filename);
        if (result?.method === 'open') {
          setDownloadNotice('Opened in a new tab — use Share or Save from your browser.');
          setTimeout(() => setDownloadNotice(''), 5000);
        }
      }
    } catch {
      setDownloadError('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadQr = async () => {
    if (!qrUrl) return;
    setDownloadError('');
    setDownloadNotice('');
    setDownloading('qr');
    try {
      await downloadFileAsBlob(qrUrl, `qr-${guest.uuid}.png`);
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
          {invitationLoadError && (
            <p className="qr-missing-notice" role="alert">{invitationLoadError}</p>
          )}
          {invitationBlobUrl && (
            <div className="preview-frame">
              <object
                data={invitationBlobUrl}
                type="application/pdf"
                className="preview-iframe"
                aria-label="Invitation PDF preview"
              >
                <p className="preview-hint">
                  PDF preview not supported in this browser.
                  {' '}
                  <a href={invitationBlobUrl} target="_blank" rel="noopener noreferrer">
                    Open invitation
                  </a>
                </p>
              </object>
            </div>
          )}
          {!invitationBlobUrl && !invitationLoadError && (
            <p className="preview-hint">Loading invitation preview…</p>
          )}
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

      {downloadNotice && (
        <p className="qr-download-notice" role="status">{downloadNotice}</p>
      )}

      {downloadError && (
        <p className="qr-download-error" role="alert">{downloadError}</p>
      )}

      <div className="download-actions">
        {invitationUrl && (
          <button
            type="button"
            onClick={handleDownloadInvitation}
            className="btn btn-primary"
            disabled={downloading === 'pdf'}
          >
            {downloading === 'pdf' ? 'Downloading…' : 'Download Invitation PDF'}
          </button>
        )}
        {qrUrl && (
          <button
            type="button"
            onClick={handleDownloadQr}
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

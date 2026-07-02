import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, getAdminToken } from '../services/api';
import './ShareInvitation.css';

function buildShareMessage(registrationUrl) {
  return `OOJ Foundation invites you to our event. Register here: ${registrationUrl}`;
}

function parseBulkInput(input) {
  return input
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseEmails(items) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return [...new Set(items.filter((item) => emailRegex.test(item)))];
}

function parsePhones(items) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return [...new Set(
    items
      .filter((item) => !emailRegex.test(item))
      .map((phone) => phone.replace(/[\s()-]/g, ''))
      .filter((phone) => /^\+?\d{7,15}$/.test(phone))
  )];
}

export default function ShareInvitation({ registrationUrl, eventTitle }) {
  const navigate = useNavigate();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);

  const shareMessage = buildShareMessage(registrationUrl);
  const bulkItems = parseBulkInput(bulkInput);
  const bulkEmails = parseEmails(bulkItems);
  const bulkPhones = parsePhones(bulkItems);

  const ensureAuthenticated = () => {
    if (!getAdminToken()) {
      navigate('/admin/login', { replace: true });
      return false;
    }
    return true;
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
    } catch {
      const input = document.createElement('input');
      input.value = registrationUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setFeedback({ type: 'success', text: 'Share message copied!' });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to copy message' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!ensureAuthenticated()) return;

    setEmailLoading(true);
    setFeedback(null);

    try {
      const { data } = await adminAPI.sendEmailInvite({ recipient_email: recipientEmail });
      setFeedback({ type: 'success', text: data.message });
      setRecipientEmail('');
    } catch (err) {
      if (err.code === 'NO_TOKEN' || err.response?.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send email invite',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleBulkEmail = async () => {
    if (!ensureAuthenticated()) return;

    if (!bulkEmails.length) {
      setFeedback({ type: 'error', text: 'No valid email addresses found in bulk input' });
      return;
    }

    setBulkLoading(true);
    setFeedback(null);

    try {
      const { data } = await adminAPI.sendEmailInvite({ bulk_input: bulkInput });
      setFeedback({ type: 'success', text: data.message });
    } catch (err) {
      if (err.code === 'NO_TOKEN' || err.response?.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send bulk email invites',
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const openWhatsAppForPhone = (phone) => {
    const digits = phone.replace(/^\+/, '');
    const text = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/${digits}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="share-invitation">
      <div className="share-header">
        <h2>Share Invitation</h2>
        <p>Invite guests to register using one shareable link</p>
      </div>

      <div className="share-message-box">
        <label>Sharable Message</label>
        <p className="share-message-text">{shareMessage}</p>
        {eventTitle && <span className="share-event-tag">{eventTitle}</span>}
      </div>

      <div className="share-actions">
        <button type="button" onClick={handleWhatsAppShare} className="btn btn-primary">
          Share on WhatsApp
        </button>
        <button type="button" onClick={handleCopyLink} className="btn btn-secondary">
          {copied ? 'Link Copied!' : 'Copy Registration Link'}
        </button>
        <button type="button" onClick={handleCopyMessage} className="btn btn-secondary">
          Copy Message
        </button>
      </div>

      {feedback && (
        <div className={`share-feedback share-feedback--${feedback.type}`}>
          {feedback.text}
        </div>
      )}

      <div className="share-forms">
        <form className="share-email-form" onSubmit={handleSendEmail}>
          <h3>Send Email Invite</h3>
          <div className="form-row">
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@email.com"
              required
            />
            <button type="submit" className="btn btn-primary" disabled={emailLoading}>
              {emailLoading ? 'Sending…' : 'Send Email Invite'}
            </button>
          </div>
        </form>

        <div className="share-bulk">
          <h3>Bulk Invite</h3>
          <p className="share-bulk-hint">
            Paste multiple emails or phone numbers (one per line, or comma-separated).
            All recipients receive the same registration link.
          </p>
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder={'guest1@email.com\nguest2@email.com\n+919876543210\n9876543210'}
            rows={5}
          />

          {bulkItems.length > 0 && (
            <div className="bulk-preview">
              {bulkEmails.length > 0 && (
                <span className="bulk-count">{bulkEmails.length} email{bulkEmails.length !== 1 ? 's' : ''} detected</span>
              )}
              {bulkPhones.length > 0 && (
                <span className="bulk-count">{bulkPhones.length} phone{bulkPhones.length !== 1 ? 's' : ''} detected</span>
              )}
            </div>
          )}

          <div className="bulk-actions">
            {bulkEmails.length > 0 && (
              <button
                type="button"
                onClick={handleBulkEmail}
                className="btn btn-primary"
                disabled={bulkLoading}
              >
                {bulkLoading ? 'Sending…' : `Email ${bulkEmails.length} Recipient${bulkEmails.length !== 1 ? 's' : ''}`}
              </button>
            )}
            {bulkPhones.length > 0 && (
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="btn btn-secondary"
              >
                Share Link via WhatsApp
              </button>
            )}
          </div>

          {bulkPhones.length > 0 && (
            <div className="bulk-phones">
              <p className="bulk-phones-label">Send via WhatsApp to:</p>
              <div className="bulk-phone-list">
                {bulkPhones.map((phone) => (
                  <button
                    key={phone}
                    type="button"
                    className="bulk-phone-btn"
                    onClick={() => openWhatsAppForPhone(phone)}
                  >
                    {phone}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

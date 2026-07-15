import { useEffect, useState } from 'react';
import { getUploadUrl } from '../services/api';
import { getStatusOptions } from '../utils/eventForm';
import './EventForm.css';

export default function EventForm({ form, onChange, onSubmit, onCancel, saving, editMode }) {
  const [bannerFile, setBannerFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => () => {
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  }, [bannerPreview, logoPreview]);

  const handleChange = (e) => {
    onChange({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'banner') {
      setBannerFile(file);
      setBannerPreview(url);
    } else {
      setLogoFile(file);
      setLogoPreview(url);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form, bannerFile, logoFile);
  };

  const existingBanner = form.banner_image ? getUploadUrl(form.banner_image) : null;
  const existingLogo = form.logo_image ? getUploadUrl(form.logo_image) : null;
  const statusOptions = getStatusOptions(form.status);
  const isActiveEvent = form.status === 'active';

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <h3>{editMode ? 'Edit Event' : 'Create New Event'}</h3>

      <div className="form-grid">
        <div className="form-group full">
          <label>Event Title *</label>
          <input name="title" value={form.title} onChange={handleChange} required placeholder="OOJ Annual Gala 2026" />
        </div>

        <div className="form-group full">
          <label>Subtitle / Tagline</label>
          <input name="subtitle" value={form.subtitle} onChange={handleChange} placeholder="An Evening of Grace & Celebration" />
        </div>

        <div className="form-group full">
          <label>Event Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the event..." />
        </div>

        <div className="form-group">
          <label>Venue *</label>
          <input name="venue" value={form.venue} onChange={handleChange} required placeholder="Grand Ballroom" />
        </div>

        <div className="form-group">
          <label>Host Name</label>
          <input name="host_name" value={form.host_name} onChange={handleChange} placeholder="OOJ Foundation" />
        </div>

        <div className="form-group">
          <label>Date *</label>
          <input type="date" name="event_date" value={form.event_date} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Time *</label>
          <input type="time" name="event_time" value={form.event_time} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Guest of Honor / Yogi Name</label>
          <input name="yogi_name" value={form.yogi_name} onChange={handleChange} placeholder="Yogi Ji" />
        </div>

        <div className="form-group">
          <label>RSVP Contact</label>
          <input name="rsvp_contact" value={form.rsvp_contact} onChange={handleChange} placeholder="events@oojfoundation.org" />
        </div>

        <div className="form-group full">
          <label>About Yogi</label>
          <textarea name="about_yogi" value={form.about_yogi} onChange={handleChange} rows={3} />
        </div>

        <div className="form-group full">
          <label>About Foundation</label>
          <textarea name="about_foundation" value={form.about_foundation} onChange={handleChange} rows={3} />
        </div>

        <div className="form-group full">
          <label>Custom Invitation Text</label>
          <textarea name="invitation_text" value={form.invitation_text} onChange={handleChange} rows={3} placeholder="Welcome message for invitation PDF..." />
        </div>

        <div className="form-group">
          <label>Theme Primary</label>
          <input type="color" name="theme_primary" value={form.theme_primary} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Theme Secondary</label>
          <input type="color" name="theme_secondary" value={form.theme_secondary} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Theme Accent</label>
          <input type="color" name="theme_accent" value={form.theme_accent} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            disabled={isActiveEvent}
            title={isActiveEvent ? 'Activate another event first to change status' : undefined}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {isActiveEvent && (
            <p className="form-hint">This is the active event. Use &quot;Set Active&quot; on another event to change status.</p>
          )}
        </div>

        <div className="form-group">
          <label>Event Banner</label>
          <input type="file" accept="image/*" onChange={(e) => handleFile(e, 'banner')} />
          {(bannerPreview || existingBanner) && (
            <img src={bannerPreview || existingBanner} alt="Banner preview" className="upload-preview banner" />
          )}
        </div>

        <div className="form-group">
          <label>Logo Upload</label>
          <input type="file" accept="image/*" onChange={(e) => handleFile(e, 'logo')} />
          {(logoPreview || existingLogo) && (
            <img src={logoPreview || existingLogo} alt="Logo preview" className="upload-preview logo" />
          )}
        </div>
      </div>

      <div className="event-form-actions">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : editMode ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
}

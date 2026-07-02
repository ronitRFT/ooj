import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { useActiveEvent } from '../context/ActiveEventContext';
import EventForm from '../components/EventForm';
import EventList from '../components/EventList';
import { emptyEventForm, eventToForm, formToFormData } from '../utils/eventForm';
import { validateImageUploadFile } from '../utils/uploadValidation';
import './AdminEvents.css';

export default function AdminEvents() {
  const { refetch: refetchActiveEvent } = useActiveEvent();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyEventForm());
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadEvents = () => {
    adminAPI.getEvents()
      .then(({ data }) => setEvents(data.data))
      .catch(() => setFeedback({ type: 'error', text: 'Failed to load events' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadEvents(); }, []);

  const resetForm = () => {
    setForm(emptyEventForm());
    setEditingId(null);
  };

  const handleSubmit = async (formData, bannerFile, logoFile) => {
    setSaving(true);
    setFeedback(null);

    const bannerCheck = bannerFile ? validateImageUploadFile(bannerFile) : { valid: true };
    if (!bannerCheck.valid) {
      setFeedback({ type: 'error', text: bannerCheck.error });
      setSaving(false);
      return;
    }

    const logoCheck = logoFile ? validateImageUploadFile(logoFile) : { valid: true };
    if (!logoCheck.valid) {
      setFeedback({ type: 'error', text: logoCheck.error });
      setSaving(false);
      return;
    }

    const fd = formToFormData(formData, bannerFile, logoFile);

    try {
      if (editingId) {
        await adminAPI.updateEvent(editingId, fd);
        setFeedback({ type: 'success', text: 'Event updated successfully' });
      } else {
        await adminAPI.createEvent(fd);
        setFeedback({ type: 'success', text: 'Event created successfully' });
      }
      resetForm();
      loadEvents();
      await refetchActiveEvent();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to save event' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setForm(eventToForm(event));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSetActive = async (id) => {
    try {
      await adminAPI.setActiveEvent(id);
      setFeedback({ type: 'success', text: 'Event set as active — QR regenerated' });
      loadEvents();
      await refetchActiveEvent();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to set active' });
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await adminAPI.duplicateEvent(id);
      setFeedback({ type: 'success', text: 'Event duplicated' });
      loadEvents();
      await refetchActiveEvent();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to duplicate' });
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this event?')) return;
    try {
      await adminAPI.archiveEvent(id);
      setFeedback({ type: 'success', text: 'Event archived' });
      loadEvents();
      await refetchActiveEvent();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to archive' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event permanently? All guest data will be removed.')) return;
    try {
      await adminAPI.deleteEvent(id);
      setFeedback({ type: 'success', text: 'Event deleted' });
      if (editingId === id) resetForm();
      loadEvents();
      await refetchActiveEvent();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to delete' });
    }
  };

  if (loading) {
    return <div className="page-center"><div className="loader">Loading events...</div></div>;
  }

  return (
    <div className="admin-events">
      <div className="admin-events-header">
        <h1>Event Management</h1>
        <p>Create and manage events for your organization</p>
      </div>

      {feedback && (
        <div className={`events-feedback events-feedback--${feedback.type}`}>{feedback.text}</div>
      )}

      <EventForm
        key={editingId ?? 'new'}
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : null}
        saving={saving}
        editMode={!!editingId}
      />

      <section className="events-list-section">
        <h2>All Events ({events.length})</h2>
        <EventList
          events={events}
          onEdit={handleEdit}
          onSetActive={handleSetActive}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      </section>
    </div>
  );
}

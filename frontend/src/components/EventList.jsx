import './EventList.css';

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function EventList({ events, onEdit, onSetActive, onDuplicate, onArchive, onDelete }) {
  if (!events.length) {
    return <p className="event-list-empty">No events yet. Create your first event above.</p>;
  }

  return (
    <div className="event-list-wrap">
      <table className="event-list-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Venue</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>
                <strong>{event.title}</strong>
                {event.subtitle && <span className="event-sub">{event.subtitle}</span>}
              </td>
              <td>{event.venue}</td>
              <td className="nowrap">{formatDate(event.event_date)}</td>
              <td>
                <span className={`status-badge status-${event.status}`}>{event.status}</span>
              </td>
              <td>
                <div className="event-actions">
                  <button type="button" className="action-btn" onClick={() => onEdit(event)}>Edit</button>
                  {event.status !== 'active' && (
                    <button type="button" className="action-btn active-btn" onClick={() => onSetActive(event.id)}>Set Active</button>
                  )}
                  <button type="button" className="action-btn" onClick={() => onDuplicate(event.id)}>Duplicate</button>
                  {event.status !== 'archived' && event.status !== 'active' && (
                    <button type="button" className="action-btn" onClick={() => onArchive(event.id)}>Archive</button>
                  )}
                  {event.status !== 'active' && (
                    <button type="button" className="action-btn danger" onClick={() => onDelete(event.id)}>Delete</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

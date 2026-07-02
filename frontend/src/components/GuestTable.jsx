import { useMemo } from 'react';
import './GuestTable.css';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function normalizePhoneSearch(value) {
  return String(value || '').replace(/[\s+\-()]/g, '');
}

function AttendanceBadge({ isAttended }) {
  return (
    <span className={`badge ${isAttended ? 'checked-in' : 'pending'}`}>
      {isAttended ? 'Checked In' : 'Pending'}
    </span>
  );
}

function GuestActions({
  guest,
  onViewQr,
  onViewInvitation,
  onQuickAdmit,
  onAttendanceToggle,
  actionLoading,
}) {
  const isLoading = actionLoading === guest.id;

  return (
    <div className="guest-actions">
      <button
        type="button"
        className="guest-action-btn"
        onClick={() => onViewQr(guest)}
        disabled={isLoading}
      >
        View QR
      </button>
      <button
        type="button"
        className="guest-action-btn"
        onClick={() => onViewInvitation(guest)}
        disabled={isLoading}
      >
        View Invitation
      </button>
      <button
        type="button"
        className="guest-action-btn guest-action-btn--admit"
        onClick={() => onQuickAdmit(guest)}
        disabled={isLoading}
      >
        Quick Admit
      </button>
      <label className="guest-attendance-toggle">
        <input
          type="checkbox"
          checked={Boolean(guest.is_attended)}
          onChange={(e) => onAttendanceToggle(guest, e.target.checked)}
          disabled={isLoading}
        />
        <span>Checked In</span>
      </label>
    </div>
  );
}

function GuestCard({
  guest,
  showEventColumn,
  onViewQr,
  onViewInvitation,
  onQuickAdmit,
  onAttendanceToggle,
  actionLoading,
}) {
  return (
    <article className="guest-card">
      <header className="guest-card-header">
        <h3 className="guest-card-name">{guest.full_name}</h3>
        <AttendanceBadge isAttended={guest.is_attended} />
      </header>
      {showEventColumn && guest.event_title && (
        <p className="guest-card-row"><span>Event</span>{guest.event_title}</p>
      )}
      <p className="guest-card-row"><span>Email</span>{guest.email}</p>
      <p className="guest-card-row"><span>Phone</span>{guest.phone || '—'}</p>
      <p className="guest-card-row"><span>Organization</span>{guest.organization || '—'}</p>
      <p className="guest-card-row"><span>Registered</span>{formatDateTime(guest.created_at)}</p>
      <p className="guest-card-row"><span>Attended</span>{formatDateTime(guest.attended_at)}</p>
      <GuestActions
        guest={guest}
        onViewQr={onViewQr}
        onViewInvitation={onViewInvitation}
        onQuickAdmit={onQuickAdmit}
        onAttendanceToggle={onAttendanceToggle}
        actionLoading={actionLoading}
      />
    </article>
  );
}

export default function GuestTable({
  guests,
  showEventColumn = false,
  onViewQr,
  onViewInvitation,
  onQuickAdmit,
  onAttendanceToggle,
  actionLoading = null,
}) {
  return (
    <>
      <div className="table-wrap guest-table-desktop">
        <table className="guest-table">
          <thead>
            <tr>
              <th scope="col">Full Name</th>
              {showEventColumn && <th scope="col">Event</th>}
              <th scope="col">Email</th>
              <th scope="col">Phone</th>
              <th scope="col">Organization</th>
              <th scope="col">Registration Time</th>
              <th scope="col">Status</th>
              <th scope="col">Attended Time</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.id}>
                <td className="cell-name">{guest.full_name}</td>
                {showEventColumn && (
                  <td>{guest.event_title || '—'}</td>
                )}
                <td>{guest.email}</td>
                <td>{guest.phone || '—'}</td>
                <td>{guest.organization || '—'}</td>
                <td className="cell-datetime">{formatDateTime(guest.created_at)}</td>
                <td>
                  <AttendanceBadge isAttended={guest.is_attended} />
                </td>
                <td className="cell-datetime">{formatDateTime(guest.attended_at)}</td>
                <td>
                  <GuestActions
                    guest={guest}
                    onViewQr={onViewQr}
                    onViewInvitation={onViewInvitation}
                    onQuickAdmit={onQuickAdmit}
                    onAttendanceToggle={onAttendanceToggle}
                    actionLoading={actionLoading}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="guest-cards-mobile">
        {guests.map((guest) => (
          <GuestCard
            key={guest.id}
            guest={guest}
            showEventColumn={showEventColumn}
            onViewQr={onViewQr}
            onViewInvitation={onViewInvitation}
            onQuickAdmit={onQuickAdmit}
            onAttendanceToggle={onAttendanceToggle}
            actionLoading={actionLoading}
          />
        ))}
      </div>
    </>
  );
}

export function useFilteredGuests(guests, { nameQuery, phoneQuery, statusFilter }) {
  return useMemo(() => {
    let result = [...guests];

    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const name = nameQuery.trim().toLowerCase();
    if (name) {
      result = result.filter((g) => g.full_name.toLowerCase().includes(name));
    }

    const phone = normalizePhoneSearch(phoneQuery);
    if (phone) {
      result = result.filter((g) => {
        if (!g.phone) return false;
        return normalizePhoneSearch(g.phone).includes(phone);
      });
    }

    if (statusFilter === 'registered') {
      result = result.filter((g) => !g.is_attended);
    } else if (statusFilter === 'checked_in') {
      result = result.filter((g) => g.is_attended);
    }

    return result;
  }, [guests, nameQuery, phoneQuery, statusFilter]);
}

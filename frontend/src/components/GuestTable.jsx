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

export default function GuestTable({ guests }) {
  if (!guests.length) {
    return <p className="empty-state">No guests match your filters.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="guest-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Organization</th>
            <th>Registration Time</th>
            <th>Attendance Status</th>
            <th>Attended Time</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((guest) => (
            <tr key={guest.id}>
              <td className="cell-name">{guest.full_name}</td>
              <td>{guest.email}</td>
              <td>{guest.phone || '—'}</td>
              <td>{guest.organization || '—'}</td>
              <td className="cell-datetime">{formatDateTime(guest.created_at)}</td>
              <td>
                <span className={`badge ${guest.is_attended ? 'checked-in' : 'registered'}`}>
                  {guest.is_attended ? 'Checked In' : 'Registered'}
                </span>
              </td>
              <td className="cell-datetime">{formatDateTime(guest.attended_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

    const phone = phoneQuery.trim();
    if (phone) {
      result = result.filter((g) => g.phone && g.phone.includes(phone));
    }

    if (statusFilter === 'registered') {
      result = result.filter((g) => !g.is_attended);
    } else if (statusFilter === 'checked_in') {
      result = result.filter((g) => g.is_attended);
    }

    return result;
  }, [guests, nameQuery, phoneQuery, statusFilter]);
}

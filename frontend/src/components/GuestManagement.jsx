import { useState, useEffect, useCallback, useRef } from 'react';
import { adminAPI } from '../services/api';
import GuestTable, { useFilteredGuests } from './GuestTable';
import './GuestManagement.css';

const REFRESH_INTERVAL_MS = 10000;

export default function GuestManagement() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nameQuery, setNameQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const isMounted = useRef(true);

  const fetchGuests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data } = await adminAPI.getGuests();
      if (isMounted.current) {
        setGuests(data.data);
        setLastUpdated(new Date());
      }
    } catch {
      // Keep existing data on silent refresh failure
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchGuests();

    const interval = setInterval(() => fetchGuests(true), REFRESH_INTERVAL_MS);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchGuests]);

  const filteredGuests = useFilteredGuests(guests, {
    nameQuery,
    phoneQuery,
    statusFilter,
  });

  const registeredCount = guests.filter((g) => !g.is_attended).length;
  const checkedInCount = guests.filter((g) => g.is_attended).length;

  return (
    <section className="guest-management">
      <div className="gm-header">
        <div>
          <h2>Guest Management</h2>
          <p className="gm-subtitle">
            {loading ? 'Loading guests…' : (
              <>
                <strong>{filteredGuests.length}</strong>
                {filteredGuests.length !== guests.length
                  ? ` of ${guests.length} guests`
                  : ` guest${guests.length !== 1 ? 's' : ''} total`}
                {' · '}
                <span className="gm-stat registered">{registeredCount} registered</span>
                {' · '}
                <span className="gm-stat checked-in">{checkedInCount} checked in</span>
              </>
            )}
          </p>
        </div>
        <div className="gm-refresh-info">
          {refreshing && <span className="gm-refreshing">Refreshing…</span>}
          {lastUpdated && !refreshing && (
            <span className="gm-last-updated">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            className="btn btn-secondary gm-refresh-btn"
            onClick={() => fetchGuests(true)}
            disabled={refreshing}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="gm-filters">
        <div className="gm-filter-group">
          <label htmlFor="search-name">Search by name</label>
          <input
            id="search-name"
            type="text"
            placeholder="Guest name…"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
          />
        </div>

        <div className="gm-filter-group">
          <label htmlFor="search-phone">Search by phone</label>
          <input
            id="search-phone"
            type="text"
            placeholder="Phone number…"
            value={phoneQuery}
            onChange={(e) => setPhoneQuery(e.target.value)}
          />
        </div>

        <div className="gm-filter-group">
          <label htmlFor="filter-status">Attendance status</label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All guests</option>
            <option value="registered">Registered</option>
            <option value="checked_in">Checked In</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="gm-loading">
          <div className="gm-spinner" />
          <p>Loading guest list…</p>
        </div>
      ) : (
        <GuestTable guests={filteredGuests} />
      )}
    </section>
  );
}

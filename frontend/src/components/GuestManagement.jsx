import { useState, useEffect, useCallback, useRef } from 'react';
import { adminAPI, fetchAuthenticatedAsset } from '../services/api';
import { downloadFileAsBlob, saveBlobAsDownload } from '../utils/download';
import GuestTable, { useFilteredGuests } from './GuestTable';
import GuestEditModal from './GuestEditModal';
import GuestImportModal from './GuestImportModal';
import './GuestManagement.css';

const STATUS_EXPORT_MAP = {
  registered: 'pending',
  checked_in: 'attended',
};

function DeleteConfirmModal({ pending, onConfirm, onCancel, deleting }) {
  if (!pending) return null;

  return (
    <div className="gm-modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="gm-modal gm-modal--confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gm-delete-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="gm-delete-modal-title">Delete guest?</h3>
        <p>
          This permanently removes <strong>{pending.full_name}</strong> and their QR / invitation
          files. This action cannot be undone.
        </p>
        <div className="gm-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete guest'}
          </button>
        </div>
      </div>
    </div>
  );
}

const REFRESH_INTERVAL_MS = 10000;
const PAGE_SIZE = 25;

function computeGuestStats(guests) {
  const total_guests = guests.length;
  const total_attended = guests.filter((g) => g.is_attended).length;
  return {
    total_guests,
    total_attended,
    total_pending: total_guests - total_attended,
  };
}

function GuestAssetModal({ modal, onClose, onMarkCheckedIn }) {
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    setDownloadError('');
  }, [modal?.guest?.id, modal?.type]);

  useEffect(() => {
    if (!modal) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal, onClose]);

  if (!modal) return null;

  const { type, guest, url, loading, error, regenerated } = modal;
  const isQr = type === 'qr';
  const title = isQr ? 'Guest QR Code' : 'Guest Invitation';

  const handleDownload = async () => {
    if (!url) return;
    const ext = isQr ? 'png' : 'pdf';
    setDownloadError('');
    try {
      await downloadFileAsBlob(url, `${guest.full_name.replace(/\s+/g, '-')}-${isQr ? 'qr' : 'invitation'}.${ext}`);
    } catch {
      setDownloadError('Download failed. Try opening the file instead.');
    }
  };

  const handleOpen = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="gm-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="gm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gm-asset-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="gm-modal-header">
          <h3 id="gm-asset-modal-title">{title}</h3>
          <p>{guest.full_name}</p>
        </header>

        {loading && <p className="gm-modal-loading">Loading assets…</p>}
        {error && <p className="gm-modal-error">{error}</p>}
        {downloadError && <p className="gm-modal-error">{downloadError}</p>}

        {!loading && !error && (
          <>
            {(regenerated?.qr || regenerated?.invitation) && (
              <p className="gm-modal-notice">
                Missing files were regenerated automatically.
              </p>
            )}

            {isQr && url && (
              <div className="gm-modal-qr-wrap">
                <img src={url} alt={`QR code for ${guest.full_name}`} className="gm-modal-qr" />
              </div>
            )}

            {!isQr && url && (
              <p className="gm-modal-meta">Invitation PDF is ready to view or download.</p>
            )}

            <div className="gm-modal-actions">
              {url && (
                <>
                  <button type="button" className="btn btn-primary" onClick={handleOpen}>
                    {isQr ? 'Open QR' : 'Open Invitation'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleDownload}>
                    Download
                  </button>
                </>
              )}
              {!guest.is_attended && onMarkCheckedIn && (
                <button
                  type="button"
                  className="btn btn-secondary gm-modal-admit-btn"
                  onClick={() => onMarkCheckedIn(guest)}
                >
                  Mark Checked In
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AttendanceConfirmModal({ pending, onConfirm, onCancel, saving }) {
  if (!pending) return null;

  const action = pending.checked ? 'mark as checked in' : 'clear check-in for';

  return (
    <div className="gm-modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="gm-modal gm-modal--confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gm-attendance-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="gm-attendance-modal-title">Update attendance?</h3>
        <p>
          Are you sure you want to update attendance?
          {' '}
          This will {action} <strong>{pending.guest.full_name}</strong>.
        </p>
        <div className="gm-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={saving}>
            {saving ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuestManagement({
  events = [],
  selectedEventId,
  onEventChange,
  onStatsUpdate,
}) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [staleNotice, setStaleNotice] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nameQuery, setNameQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [assetModal, setAssetModal] = useState(null);
  const [attendancePending, setAttendancePending] = useState(null);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [editGuest, setEditGuest] = useState(null);
  const [deletePending, setDeletePending] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const closeAssetModal = useCallback(() => {
    setAssetModal((current) => {
      if (current?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  }, []);

  const isMounted = useRef(true);
  const showEventColumn = selectedEventId === 'all';

  const updateGuestInList = useCallback((updatedGuest) => {
    setGuests((current) => current.map((g) => (
      g.id === updatedGuest.id ? { ...g, ...updatedGuest } : g
    )));
  }, []);

  const fetchGuests = useCallback(async (silent = false) => {
    if (selectedEventId == null) return;

    if (!silent) {
      setLoading(true);
      setFetchError('');
      setStaleNotice('');
    } else {
      setRefreshing(true);
    }

    try {
      const { data } = selectedEventId === 'all'
        ? await adminAPI.getGuests()
        : await adminAPI.getGuestsByEvent(selectedEventId);

      if (!isMounted.current) return;

      const guestList = data.data || [];
      setGuests(guestList);
      setLastUpdated(new Date());
      setFetchError('');
      setStaleNotice('');

      const stats = computeGuestStats(guestList);
      const selectedEvent = selectedEventId === 'all'
        ? null
        : events.find((e) => e.id === selectedEventId);

      onStatsUpdate?.({
        ...stats,
        event_id: selectedEventId === 'all' ? null : selectedEventId,
        event_title: selectedEventId === 'all' ? 'All Events' : (selectedEvent?.title || ''),
      });
    } catch {
      if (!isMounted.current) return;
      if (!silent) {
        setGuests([]);
        setFetchError('Failed to load guests');
        setStaleNotice('');
        const selectedEvent = selectedEventId === 'all'
          ? null
          : events.find((e) => e.id === selectedEventId);
        onStatsUpdate?.({
          total_guests: 0,
          total_attended: 0,
          total_pending: 0,
          event_id: selectedEventId === 'all' ? null : selectedEventId,
          event_title: selectedEventId === 'all' ? 'All Events' : (selectedEvent?.title || ''),
        });
      } else {
        setStaleNotice('Data may be outdated');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [selectedEventId, events, onStatsUpdate]);

  useEffect(() => {
    isMounted.current = true;
    fetchGuests();

    const interval = setInterval(() => fetchGuests(true), REFRESH_INTERVAL_MS);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchGuests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEventId, nameQuery, phoneQuery, statusFilter]);

  const filteredGuests = useFilteredGuests(guests, {
    nameQuery,
    phoneQuery,
    statusFilter,
  });

  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedGuests = filteredGuests.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const filteredStats = computeGuestStats(filteredGuests);
  const registeredCount = filteredStats.total_pending;
  const checkedInCount = filteredStats.total_attended;
  const hasSearchQuery = Boolean(nameQuery.trim() || phoneQuery.trim());

  const loadGuestAssets = async (guest, type, { promptAdmit = false } = {}) => {
    setActionError('');
    setActionLoading(guest.id);
    setAssetModal({
      type,
      guest,
      url: null,
      loading: true,
      error: '',
      regenerated: null,
    });

    try {
      const { data } = await adminAPI.getGuestAssets(guest.id);
      const payload = data.data;
      const assetPath = type === 'qr' ? payload.qr_url : payload.invitation_url;
      let url = null;

      if (assetPath) {
        url = await fetchAuthenticatedAsset(assetPath);
      }

      if (!url) {
        setAssetModal({
          type,
          guest: payload.guest || guest,
          url: null,
          loading: false,
          error: type === 'qr'
            ? 'QR code could not be recovered.'
            : 'Invitation could not be recovered.',
          regenerated: payload.regenerated,
        });
        return;
      }

      const resolvedGuest = payload.guest || guest;

      setAssetModal({
        type,
        guest: resolvedGuest,
        url,
        loading: false,
        error: '',
        regenerated: payload.regenerated,
      });

      if (payload.guest) {
        updateGuestInList(payload.guest);
      }

      if (promptAdmit && !resolvedGuest.is_attended) {
        setAttendancePending({ guest: resolvedGuest, checked: true });
      }

      return resolvedGuest;
    } catch (err) {
      setAssetModal({
        type,
        guest,
        url: null,
        loading: false,
        error: err.response?.data?.message || 'Failed to load guest assets',
        regenerated: null,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewQr = (guest) => loadGuestAssets(guest, 'qr');
  const handleViewInvitation = (guest) => loadGuestAssets(guest, 'invitation');

  const handleQuickAdmit = (guest) => {
    loadGuestAssets(guest, 'qr', { promptAdmit: true });
  };

  const handleAttendanceToggle = (guest, checked) => {
    setAttendancePending({ guest, checked });
  };

  const confirmAttendanceUpdate = async () => {
    if (!attendancePending) return;

    setAttendanceSaving(true);
    setActionError('');

    try {
      const { data } = await adminAPI.updateGuestAttendance(
        attendancePending.guest.id,
        attendancePending.checked,
      );
      updateGuestInList(data.data);
      setAttendancePending(null);
      setAssetModal((current) => (
        current?.guest?.id === data.data.id
          ? { ...current, guest: data.data }
          : current
      ));
      await fetchGuests(true);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update attendance');
    } finally {
      setAttendanceSaving(false);
    }
  };

  const handleMarkCheckedInFromModal = (guest) => {
    closeAssetModal();
    setAttendancePending({ guest, checked: true });
  };

  const handleEditGuest = (guest) => {
    setActionError('');
    setEditGuest(guest);
  };

  const handleGuestSaved = (updatedGuest) => {
    updateGuestInList(updatedGuest);
    fetchGuests(true);
  };

  const handleDeleteGuest = (guest) => {
    setActionError('');
    setDeletePending(guest);
  };

  const confirmDeleteGuest = async () => {
    if (!deletePending) return;
    setDeleting(true);
    setActionError('');
    try {
      await adminAPI.deleteGuest(deletePending.id);
      setGuests((current) => current.filter((g) => g.id !== deletePending.id));
      setDeletePending(null);
      await fetchGuests(true);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete guest');
    } finally {
      setDeleting(false);
    }
  };

  const handleImported = () => {
    fetchGuests(true);
  };

  const handleExport = async () => {
    setActionError('');
    setExporting(true);
    try {
      const status = STATUS_EXPORT_MAP[statusFilter] || null;
      const { data } = await adminAPI.exportGuests({ eventId: selectedEventId, status });
      const stamp = new Date().toISOString().slice(0, 10);
      saveBlobAsDownload(data, `guests-${stamp}.csv`);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to export guests');
    } finally {
      setExporting(false);
    }
  };

  const activeEventTitle = events.find((e) => e.status === 'active')?.title || '';

  const handleEventChange = (e) => {
    const value = e.target.value;
    onEventChange(value === 'all' ? 'all' : Number(value));
  };

  const renderGuestContent = () => {
    if (loading) {
      return (
        <div className="gm-loading">
          <div className="gm-spinner" />
          <p>Loading guest list…</p>
        </div>
      );
    }

    if (fetchError) {
      return (
        <div className="gm-error">
          <p>{fetchError}</p>
          <button type="button" className="btn btn-secondary" onClick={() => fetchGuests()}>
            Retry
          </button>
        </div>
      );
    }

    if (guests.length === 0) {
      return <p className="empty-state">No guests found</p>;
    }

    if (filteredGuests.length === 0) {
      return <p className="empty-state">No guests match your filters.</p>;
    }

    return (
      <>
        {hasSearchQuery && (
          <div className="gm-quick-admit-banner">
            <strong>{filteredGuests.length}</strong>
            {' '}
            guest{filteredGuests.length !== 1 ? 's' : ''} match your search.
            Use <em>View QR</em> or <em>Quick Admit</em> to recover QR and check them in manually.
          </div>
        )}

        <GuestTable
          guests={paginatedGuests}
          showEventColumn={showEventColumn}
          onViewQr={handleViewQr}
          onViewInvitation={handleViewInvitation}
          onQuickAdmit={handleQuickAdmit}
          onAttendanceToggle={handleAttendanceToggle}
          onEdit={handleEditGuest}
          onDelete={handleDeleteGuest}
          actionLoading={actionLoading}
        />

        {totalPages > 1 && (
          <div className="gm-pagination">
            <button
              type="button"
              className="btn btn-secondary gm-page-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              Previous
            </button>
            <span className="gm-page-info">
              Page {safePage} of {totalPages}
              {' · '}
              {filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              className="btn btn-secondary gm-page-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <section className="guest-management">
      <GuestAssetModal
        modal={assetModal}
        onClose={closeAssetModal}
        onMarkCheckedIn={handleMarkCheckedInFromModal}
      />

      <AttendanceConfirmModal
        pending={attendancePending}
        onConfirm={confirmAttendanceUpdate}
        onCancel={() => setAttendancePending(null)}
        saving={attendanceSaving}
      />

      <GuestEditModal
        guest={editGuest}
        onClose={() => setEditGuest(null)}
        onSaved={handleGuestSaved}
      />

      <DeleteConfirmModal
        pending={deletePending}
        onConfirm={confirmDeleteGuest}
        onCancel={() => setDeletePending(null)}
        deleting={deleting}
      />

      {showImport && (
        <GuestImportModal
          activeEventTitle={activeEventTitle}
          onClose={() => setShowImport(false)}
          onImported={handleImported}
        />
      )}

      <div className="gm-header">
        <div>
          <h2>Guest Management</h2>
          <p className="gm-subtitle">
            {loading ? 'Loading guests…' : fetchError ? (
              'Unable to display guest counts'
            ) : (
              <>
                <strong>{filteredGuests.length}</strong>
                {filteredGuests.length !== guests.length
                  ? ` of ${guests.length} guests`
                  : ` guest${guests.length !== 1 ? 's' : ''} total`}
                {' · '}
                <span className="gm-stat pending">{registeredCount} pending</span>
                {' · '}
                <span className="gm-stat checked-in">{checkedInCount} checked in</span>
              </>
            )}
          </p>
        </div>
        <div className="gm-refresh-info">
          {refreshing && <span className="gm-refreshing">Refreshing…</span>}
          {staleNotice && !refreshing && (
            <span className="gm-stale-notice">{staleNotice}</span>
          )}
          {lastUpdated && !refreshing && !fetchError && !staleNotice && (
            <span className="gm-last-updated">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            className="btn btn-secondary gm-refresh-btn"
            onClick={() => fetchGuests(true)}
            disabled={refreshing || selectedEventId == null}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="gm-toolbar">
        <button
          type="button"
          className="btn btn-secondary gm-toolbar-btn"
          onClick={() => setShowImport(true)}
        >
          Import CSV
        </button>
        <button
          type="button"
          className="btn btn-secondary gm-toolbar-btn"
          onClick={handleExport}
          disabled={exporting || loading || guests.length === 0}
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {actionError && (
        <div className="gm-action-error" role="alert">{actionError}</div>
      )}

      <div className="gm-filters">
        <div className="gm-filter-group">
          <label htmlFor="filter-event">Event</label>
          <select
            id="filter-event"
            value={selectedEventId ?? ''}
            onChange={handleEventChange}
            disabled={selectedEventId == null}
          >
            {selectedEventId == null && <option value="">Loading events…</option>}
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
                {event.status === 'active' ? ' (Active)' : ''}
              </option>
            ))}
            <option value="all">All Events</option>
          </select>
        </div>

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
            <option value="registered">Pending</option>
            <option value="checked_in">Checked In</option>
          </select>
        </div>
      </div>

      {renderGuestContent()}
    </section>
  );
}

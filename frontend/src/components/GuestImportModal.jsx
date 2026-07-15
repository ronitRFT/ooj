import { useEffect, useRef, useState } from 'react';
import { adminAPI } from '../services/api';
import { saveBlobAsDownload } from '../utils/download';

const TEMPLATE_CSV = 'full_name,email,phone,organization\nJane Doe,jane@example.com,9876543210,Acme Inc\n';

function previewRows(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [], dataCount: 0 };
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1, 6).map((line) => line.split(','));
  return { headers, rows, dataCount: lines.length - 1 };
}

export default function GuestImportModal({ activeEventTitle, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleFile = (selected) => {
    setError('');
    setSummary(null);
    setFile(selected);
    if (!selected) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(previewRows(String(reader.result || '')));
    reader.onerror = () => setError('Could not read the selected file');
    reader.readAsText(selected);
  };

  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await adminAPI.importGuests(formData);
      setSummary(data.data);
      onImported?.(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed. Check the file format and try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    saveBlobAsDownload(new Blob([TEMPLATE_CSV], { type: 'text/csv' }), 'guest-import-template.csv');
  };

  return (
    <div className="gm-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="gm-modal gm-modal--import"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gm-import-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="gm-modal-header">
          <h3 id="gm-import-modal-title">Import Guests</h3>
          <p>
            Guests are imported into the active event
            {activeEventTitle ? <> — <strong>{activeEventTitle}</strong></> : ''}.
            Duplicates (same email or phone) are skipped automatically.
          </p>
        </header>

        {error && <p className="gm-modal-error" role="alert">{error}</p>}

        {!summary && (
          <>
            <div className="gm-import-picker">
              <input
                ref={fileInputRef}
                id="gm-import-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              <button type="button" className="btn btn-link gm-template-btn" onClick={downloadTemplate}>
                Download CSV template
              </button>
            </div>

            <p className="gm-import-hint">
              Required columns: <code>full_name</code>, <code>email</code>.
              Optional: <code>phone</code>, <code>organization</code>.
            </p>

            {preview && (
              <div className="gm-import-preview">
                <p className="gm-import-count">
                  <strong>{preview.dataCount}</strong> row{preview.dataCount !== 1 ? 's' : ''} detected
                  {preview.dataCount > 5 ? ' (showing first 5)' : ''}
                </p>
                <div className="table-wrap">
                  <table className="gm-preview-table">
                    <thead>
                      <tr>{preview.headers.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, ri) => (
                        <tr key={ri}>
                          {preview.headers.map((_, ci) => <td key={ci}>{row[ci] ?? ''}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="gm-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={uploading}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImport}
                disabled={!file || uploading}
              >
                {uploading ? 'Importing…' : 'Import guests'}
              </button>
            </div>
          </>
        )}

        {summary && (
          <div className="gm-import-summary">
            <ul className="gm-summary-stats">
              <li className="gm-summary-imported"><strong>{summary.imported}</strong> imported</li>
              <li className="gm-summary-skipped"><strong>{summary.skipped}</strong> skipped (duplicates)</li>
              <li className="gm-summary-failed"><strong>{summary.failed}</strong> failed</li>
            </ul>

            {summary.errors?.length > 0 && (
              <div className="gm-summary-errors">
                <p>Rows with problems:</p>
                <ul>
                  {summary.errors.map((e, i) => (
                    <li key={i}>Line {e.line}: {e.error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="gm-modal-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

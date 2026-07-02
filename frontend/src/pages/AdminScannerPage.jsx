import Scanner from './Scanner';
import './AdminPublicPage.css';

export default function AdminScannerPage() {
  return (
    <div className="admin-public-page">
      <h1 className="admin-page-title">Scanner Page</h1>
      <p className="admin-page-subtitle">Guest check-in QR scanner</p>
      <Scanner />
    </div>
  );
}

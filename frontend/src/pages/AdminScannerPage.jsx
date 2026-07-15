import Scanner from './Scanner';
import './AdminPublicPage.css';

export default function AdminScannerPage() {
  return (
    <div className="admin-public-page admin-scanner-page">
      <Scanner embedded />
    </div>
  );
}

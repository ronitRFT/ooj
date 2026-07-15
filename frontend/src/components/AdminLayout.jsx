import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminBackButton from './AdminBackButton';
import './AdminLayout.css';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-layout-content">
        <AdminBackButton />
        <Outlet />
      </div>
    </div>
  );
}

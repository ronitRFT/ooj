import Register from './Register';
import './AdminPublicPage.css';

export default function AdminRegistrationPage() {
  return (
    <div className="admin-public-page">
      <h1 className="admin-page-title">Public Registration Page</h1>
      <p className="admin-page-subtitle">Preview of the guest registration experience</p>
      <Register />
    </div>
  );
}

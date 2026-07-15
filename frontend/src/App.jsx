import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminIndexRedirect from './components/AdminIndexRedirect';
import ErrorBoundary from './components/ErrorBoundary';
import { ActiveEventProvider } from './context/ActiveEventContext';
import Landing from './pages/Landing';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import NotFound from './pages/NotFound';
import AdminAuthSync from './components/AdminAuthSync';
import { ROLES } from './utils/adminAuth';
import './App.css';

const Success = lazy(() => import('./pages/Success'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminRegistrationPage = lazy(() => import('./pages/AdminRegistrationPage'));
const AdminScannerPage = lazy(() => import('./pages/AdminScannerPage'));
const AdminEvents = lazy(() => import('./pages/AdminEvents'));
const AdminManagement = lazy(() => import('./pages/AdminManagement'));
const AdminReports = lazy(() => import('./pages/AdminReports'));

function PageLoader() {
  return <div className="page-center"><div className="loader">Loading...</div></div>;
}

function PublicLayout() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function AdminShell() {
  return (
    <div className="app admin-app">
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ActiveEventProvider>
        <ErrorBoundary>
          <AdminAuthSync />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Landing />} />
              <Route path="register" element={<Register />} />
              <Route path="success/:uuid" element={<Success />} />
            </Route>

            <Route path="admin" element={<AdminShell />}>
              <Route path="login" element={<AdminLogin />} />
              <Route index element={<AdminIndexRedirect />} />
              <Route element={<ProtectedAdminRoute />}>
                <Route element={<AdminLayout />}>
                  {/* All authenticated roles (incl. volunteer) */}
                  <Route path="scanner" element={<AdminScannerPage />} />
                  <Route path="registration" element={<AdminRegistrationPage />} />

                  {/* Managers: super_admin + admin */}
                  <Route element={<ProtectedAdminRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]} />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="events" element={<AdminEvents />} />
                    <Route path="reports" element={<AdminReports />} />
                  </Route>

                  {/* Super admin only */}
                  <Route element={<ProtectedAdminRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
                    <Route path="admins" element={<AdminManagement />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<NotFound admin />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </ActiveEventProvider>
    </BrowserRouter>
  );
}

export default App;

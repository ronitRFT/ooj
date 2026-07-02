import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminIndexRedirect from './components/AdminIndexRedirect';
import ErrorBoundary from './components/ErrorBoundary';
import { ActiveEventProvider } from './context/ActiveEventContext';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Success from './pages/Success';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminRegistrationPage from './pages/AdminRegistrationPage';
import AdminScannerPage from './pages/AdminScannerPage';
import AdminEvents from './pages/AdminEvents';
import AdminAuthSync from './components/AdminAuthSync';
import './App.css';

function PublicAppShell() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/success/:uuid" element={<Success />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (!isAdminRoute) {
    return (
      <div className="app">
        <PublicAppShell />
      </div>
    );
  }

  return (
    <div className="app admin-app">
      <main className="main-content">
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminIndexRedirect />} />

          <Route element={<ProtectedAdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/registration" element={<AdminRegistrationPage />} />
              <Route path="/admin/scanner" element={<AdminScannerPage />} />
            </Route>
          </Route>
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ActiveEventProvider>
          <AdminAuthSync />
          <AppContent />
        </ActiveEventProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminIndexRedirect from './components/AdminIndexRedirect';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Success from './pages/Success';
import Scanner from './pages/Scanner';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminRegistrationPage from './pages/AdminRegistrationPage';
import AdminScannerPage from './pages/AdminScannerPage';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app">
      {!isAdminRoute && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/success" element={<Success />} />
          <Route path="/scanner" element={<Scanner />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminIndexRedirect />} />

          <Route element={<ProtectedAdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/registration" element={<AdminRegistrationPage />} />
              <Route path="/admin/scanner" element={<AdminScannerPage />} />
            </Route>
          </Route>
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

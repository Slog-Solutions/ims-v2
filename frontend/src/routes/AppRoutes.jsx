import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Auth Pages (Lazy loaded)
const Login = lazy(() => import('../pages/auth/Login.jsx'));

// Application Pages (Lazy loaded for fast initial app render)
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const NomenclatureMaster = lazy(() => import('../pages/NomenclatureMaster.jsx'));
const Vouchers = lazy(() => import('../pages/Vouchers.jsx'));
const Condemnations = lazy(() => import('../pages/Condemnations.jsx'));
const Reports = lazy(() => import('../pages/Reports.jsx'));
const Profile = lazy(() => import('../pages/shared/Profile.jsx'));
const EquipmentCentral = lazy(() => import('../pages/EquipmentCentral.jsx'));
const TaskPlanner = lazy(() => import('../pages/TaskPlanner.jsx'));
const RfidSimulator = lazy(() => import('../pages/RfidSimulator.jsx'));
const ItemsCatalog = lazy(() => import('../pages/ItemsCatalog.jsx'));

// Layout Wrapper
import Sidebar from '../components/layout/Sidebar.jsx';
import Navbar from '../components/layout/Navbar.jsx';

/* ─── Skeleton Page Loader ─────────────────────────────── */
const PageFallbackLoader = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      padding: 'var(--space-xl)',
      minHeight: '100vh',
      background: 'var(--bg-cream)',
    }}
  >
    {/* Title skeleton */}
    <div>
      <div className="skeleton skeleton-text" style={{ width: '35%', height: 26, marginBottom: 10 }} />
      <div className="skeleton skeleton-text" style={{ width: '50%', height: 14 }} />
    </div>

    {/* Stat cards skeleton */}
    <div className="stats-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-circle" style={{ width: 48, height: 48 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '55%', height: 12 }} />
            <div className="skeleton skeleton-text" style={{ width: '35%', height: 20, marginBottom: 0 }} />
          </div>
        </div>
      ))}
    </div>

    {/* Table skeleton */}
    <div className="card-farm" style={{ padding: 'var(--space-lg)' }}>
      <div className="skeleton skeleton-text" style={{ width: '25%', height: 18, marginBottom: 20 }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div className="skeleton skeleton-text" style={{ width: '20%', height: 14, marginBottom: 0 }} />
          <div className="skeleton skeleton-text" style={{ width: '15%', height: 14, marginBottom: 0 }} />
          <div className="skeleton skeleton-text" style={{ width: '30%', height: 14, marginBottom: 0 }} />
          <div className="skeleton skeleton-text" style={{ width: '10%', height: 14, marginBottom: 0 }} />
          <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 12 }} />
        </div>
      ))}
    </div>
  </div>
);

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      {/* Global Background Photo, Grid & Watermark */}
      <div className="app-bg-photo" aria-hidden="true" />
      <div className="app-bg-overlay" aria-hidden="true" />
      <div className="app-bg-grid" aria-hidden="true" />
      <div className="app-bg-glow app-bg-glow--tl" aria-hidden="true" />
      <div className="app-bg-glow app-bg-glow--br" aria-hidden="true" />
      <div className="app-bg-watermark" aria-hidden="true">
        <span className="app-bg-word">INVENTORY</span>
      </div>

      <div className="app-body-layout">
        <Sidebar />
        <div className="app-main-area">
          <Navbar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <PageFallbackLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Suspense fallback={<PageFallbackLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />

        {/* Protected General Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/items"
          element={
            <ProtectedRoute>
              <NomenclatureMaster />
            </ProtectedRoute>
          }
        />

        <Route
          path="/catalog"
          element={
            <ProtectedRoute>
              <ItemsCatalog />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vouchers"
          element={
            <ProtectedRoute>
              <Vouchers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/condemnations"
          element={
            <ProtectedRoute>
              <Condemnations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/equipment-sets"
          element={
            <ProtectedRoute>
              <EquipmentCentral />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <TaskPlanner />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rfid-simulator"
          element={
            <ProtectedRoute>
              <RfidSimulator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Fallback Redirect */}
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

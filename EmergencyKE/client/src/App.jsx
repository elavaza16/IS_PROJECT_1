import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }   from './context/AuthContext';
import ProtectedRoute     from './components/ProtectedRoute';

// Auth pages
import Login       from './pages/auth/Login';
import Register    from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';

// Community member pages
import PublicDashboard  from './pages/public/PublicDashboard';
import ReportEmergency  from './pages/public/ReportEmergency';
import ActiveIncident   from './pages/public/ActiveIncident';
import ApplyVolunteer   from './pages/public/ApplyVolunteer';

// Dashboard placeholders — Mercy will replace these
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import AdminDashboard     from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public routes ── */}
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* ── Community member routes ── */}
          <Route path="/" element={
            <ProtectedRoute roles={['community_member', 'volunteer']}>
              <PublicDashboard />
            </ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute roles={['community_member', 'volunteer']}>
              <ReportEmergency />
            </ProtectedRoute>
          } />
          <Route path="/incident/:id" element={
            <ProtectedRoute roles={['community_member', 'volunteer']}>
              <ActiveIncident />
            </ProtectedRoute>
          } />
          <Route path="/apply-volunteer" element={
            <ProtectedRoute roles={['community_member']}>
              <ApplyVolunteer />
            </ProtectedRoute>
          } />

          {/* ── Volunteer routes — Mercy will expand these ── */}
          <Route path="/volunteer" element={
            <ProtectedRoute roles={['volunteer']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          } />
          {/* Mercy adds /volunteer/alert/:id and /volunteer/history here */}

          {/* ── Admin routes ── */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";

// Community member pages
import PublicDashboard from "./pages/public/PublicDashboard";
import ReportEmergency from "./pages/public/ReportEmergency";
import ActiveIncident from "./pages/public/ActiveIncident";
import ApplyVolunteer from "./pages/public/ApplyVolunteer";
import MyReports from "./pages/public/MyReports";

// Volunteer pages
import VolunteerDashboard from "./pages/volunteer/VolunteerDashboard";
import ActiveAlert from "./pages/volunteer/ActiveAlert";
import ResponseHistory from "./pages/volunteer/ResponseHistory";
import VolunteerIncidents from './pages/volunteer/VolunteerIncidents';

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVolunteers from "./pages/admin/AdminVolunteers";
import AdminVolunteerDetail from "./pages/admin/AdminVolunteerDetail";
import AdminIncidents from "./pages/admin/AdminIncidents";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Auth ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* ── Community member ── */}
          <Route
            path="/"
            element={
              <ProtectedRoute roles={["community_member", "volunteer"]}>
                <PublicDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute roles={["community_member", "volunteer"]}>
                <ReportEmergency />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incident/:id"
            element={
              <ProtectedRoute roles={["community_member", "volunteer"]}>
                <ActiveIncident />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apply-volunteer"
            element={
              <ProtectedRoute roles={["community_member"]}>
                <ApplyVolunteer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute roles={["community_member", "volunteer"]}>
                <MyReports />
              </ProtectedRoute>
            }
          />

          {/* ── Volunteer ── */}
          <Route
            path="/volunteer"
            element={
              <ProtectedRoute roles={["volunteer"]}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/alert/:id"
            element={
              <ProtectedRoute roles={["volunteer"]}>
                <ActiveAlert />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/history"
            element={
              <ProtectedRoute roles={["volunteer"]}>
                <ResponseHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/incidents"
            element={
              <ProtectedRoute roles={["volunteer"]}>
                <VolunteerIncidents />
              </ProtectedRoute>
            }
          />

          {/* ── Admin ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/volunteers"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminVolunteers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/volunteers/:id"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminVolunteerDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/incidents"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminIncidents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import PatientProfile from "./pages/PatientProfile";
import NearestHospital from "./pages/NearestHospital";
import SystemAdminDashboard from "./pages/SystemAdminDashboard";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";
import {
  getAuthToken,
  getAuthUser,
  hydrateAuthSessionFromPersistent,
  setAuthSession,
} from "./utils/authStorage";
import api from "./services/api";

function getRoleHomePath(user) {
  if (user?.role === "system_admin") return "/admin";
  if (user?.role === "hospital_admin") return "/dashboard";
  if (user?.role === "doctor") return "/doctor/dashboard";
  if (user?.role === "receptionist") return "/receptionist/dashboard";
  if (user?.role === "patient") return "/patient/profile";
  return "/login";
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = getAuthToken();
  const user = getAuthUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleHomePath(user)} replace />;
  }

  return children;
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    hydrateAuthSessionFromPersistent();

    // On app mount, validate token and sync user data
    const token = getAuthToken();
    if (token) {
      api.post("/auth/validate-token")
        .then(({ data }) => {
          if (data.success && data.user) {
            // Update storage with fresh user data from backend
            const rememberMe = window.localStorage.getItem("healthnet_remember_me") === "true";
            setAuthSession(token, data.user, rememberMe);
          }
        })
        .catch(() => {
          // Token validation failed, route guards will handle redirect behavior.
        })
        .finally(() => {
          setIsInitialized(true);
        });
    } else {
      setIsInitialized(true);
    }
  }, []);

  if (!isInitialized) return null; // Don't render routes until token is validated

  function PresenceTracker() {
    const token = getAuthToken();

    useEffect(() => {
      if (!token) return undefined;

      const heartbeat = () => {
        api.post("/auth/presence/heartbeat").catch(() => {
          // Presence updates should not interrupt UX.
        });
      };

      heartbeat();
      const timer = setInterval(heartbeat, 45000);

      const onVisibility = () => {
        if (document.visibilityState === "visible") {
          heartbeat();
        }
      };
      document.addEventListener("visibilitychange", onVisibility);

      return () => {
        clearInterval(timer);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }, [token]);

    return null;
  }

  return (
    <Router>
      <PresenceTracker />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute allowedRoles={["hospital_admin"]}>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/doctor/dashboard"
          element={(
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin"
          element={(
            <ProtectedRoute allowedRoles={["system_admin"]}>
              <SystemAdminDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/receptionist/dashboard"
          element={(
            <ProtectedRoute allowedRoles={["receptionist"]}>
              <ReceptionistDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/patient/profile"
          element={(
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientProfile />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/nearest-hospitals"
          element={<Navigate to="/patient/profile?section=nearest" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import { setAuthSession } from "../utils/authStorage";

function resolveDashboardPath(role) {
  if (role === "system_admin") return "/admin";
  if (role === "doctor") return "/doctor/dashboard";
  if (role === "receptionist") return "/receptionist/dashboard";
  if (role === "patient") return "/patient/profile";
  return "/dashboard";
}

function parseHashParams() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  return new URLSearchParams(hash);
}

export default function GoogleAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const params = parseHashParams();
      const error = params.get("error");
      const state = params.get("state");
      const idToken = params.get("id_token");

      const expectedState = sessionStorage.getItem("google_oauth_state");
      if (!expectedState || state !== expectedState) {
        toast.error("Google sign-in state mismatch. Please try again.");
        navigate("/login", { replace: true });
        return;
      }

      sessionStorage.removeItem("google_oauth_state");
      sessionStorage.removeItem("google_oauth_nonce");

      if (error) {
        toast.error(`Google sign-in error: ${error}`);
        navigate("/login", { replace: true });
        return;
      }

      if (!idToken) {
        toast.error("Google sign-in did not return an ID token.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        const { data } = await api.post("/auth/google", { credential: idToken });
        if (data.success) {
          setAuthSession(data.token, data.user, false);
          toast.success("Signed in with Google.");
          navigate(resolveDashboardPath(data.user?.role), { replace: true });
          return;
        }
        toast.error("Google sign-in failed.");
        navigate("/login", { replace: true });
      } catch (apiError) {
        toast.error(apiError.response?.data?.message || "Google sign-in failed.");
        navigate("/login", { replace: true });
      }
    };

    void run();
  }, [navigate]);

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h1>Completing Google Sign-In</h1>
        <p>Please wait while we sign you in securely.</p>
      </div>
    </div>
  );
}

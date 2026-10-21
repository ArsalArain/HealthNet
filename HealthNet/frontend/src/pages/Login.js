import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import api from "../services/api";
import BrandLogo from "../components/BrandLogo";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { setAuthSession, getRememberPreference, getAuthUser, getAuthToken } from "../utils/authStorage";

function resolveDashboardPath(role) {
  if (role === "system_admin") return "/admin";
  if (role === "doctor") return "/doctor/dashboard";
  if (role === "receptionist") return "/receptionist/dashboard";
  if (role === "patient") return "/patient/profile";
  return "/dashboard";
}

export default function Login() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => getRememberPreference());
  const [emailInput, setEmailInput] = useState("");
  const [lockState, setLockState] = useState({ email: "", unlockAt: 0, message: "", secondsLeft: 0 });

  useEffect(() => {
    // Clear any theme attributes when mounting Login page to ensure light theme layout.
    if (typeof document !== "undefined") {
      document.documentElement.removeAttribute("data-theme");
      document.body.removeAttribute("data-theme");
    }

    const user = getAuthUser();
    const token = getAuthToken();
    if (user && token) {
      navigate(resolveDashboardPath(user.role), { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!lockState.unlockAt) {
      return undefined;
    }

    const timer = setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((lockState.unlockAt - Date.now()) / 1000));
      setLockState((prev) => {
        if (!prev.unlockAt) return prev;
        if (secondsLeft === 0) {
          return { email: "", unlockAt: 0, message: "", secondsLeft: 0 };
        }
        return { ...prev, secondsLeft };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockState.unlockAt]);

  const normalizedEmail = String(emailInput || "").trim().toLowerCase();
  const isCurrentEmailLocked = Boolean(
    lockState.email
    && normalizedEmail
    && lockState.email === normalizedEmail
    && lockState.secondsLeft > 0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (data.success) {
        setLockState({ email: "", unlockAt: 0, message: "", secondsLeft: 0 });
        setAuthSession(data.token, data.user, rememberMe);
        localStorage.setItem("adminPage", "home");
        toast.success("Welcome back! 🎉");
          navigate(resolveDashboardPath(data.user?.role));
      }
    } catch (err) {
      const res = err.response?.data;

      // If standard user login fails with invalid credentials,
      // try staff login so doctors/nurses/receptionists can use the same form.
      if (err.response?.status === 401 && String(res?.message || "").toLowerCase() === "invalid credentials.") {
        try {
          const staffResp = await api.post("/staff-auth/login", { email, password });
          if (staffResp?.data?.success) {
            setLockState({ email: "", unlockAt: 0, message: "", secondsLeft: 0 });
            setAuthSession(staffResp.data.token, staffResp.data.user, rememberMe);
            localStorage.setItem("adminPage", "home");
            toast.success("Welcome back! 🎉");
            navigate(resolveDashboardPath(staffResp.data.user?.role));
            return;
          }
        } catch (staffErr) {
          const staffMessage = staffErr.response?.data?.message;
          if (staffMessage) {
            toast.error(staffMessage);
            return;
          }
          toast.error("Login failed.");
          return;
        }
      }

      if (res?.needs_verification) {
        toast.warning(res.message);
        navigate("/verify-otp", { state: { contact: res.contact, purpose: "verify" } });
      } else if (err.response?.status === 423 && email) {
        const retrySeconds = Math.max(1, Number(res?.retry_after_seconds || 0));
        const parsedSeconds = Number.isFinite(retrySeconds) && retrySeconds > 0
          ? retrySeconds
          : Number((String(res?.message || "").match(/(\d+)\s*seconds?/i) || [])[1] || 0);
        const secondsLeft = Math.max(1, parsedSeconds || 60);

        setLockState({
          email,
          unlockAt: Date.now() + secondsLeft * 1000,
          message: res?.message || "This account is temporarily locked.",
          secondsLeft,
        });
      } else {
        toast.error(res?.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) {
      toast.error("Google sign-in did not return a credential.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/google", { credential: response.credential });
      if (data.success) {
        setAuthSession(data.token, data.user, false);
        localStorage.setItem("adminPage", "home");
        toast.success("Signed in with Google.");
        navigate(resolveDashboardPath(data.user?.role));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <BrandLogo className="logo-icon" />
          <h1>HealthNet</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="on">

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="text"
                id="login-username"
                name="email"
                placeholder="Enter email"
                autoComplete="username"
                spellCheck="false"
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPass ? "text" : "password"}
                id="login-password"
                name="password"
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
              >
                {showPass ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Remember Me + Forgot Password row */}
          <div className="remember-row">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="forgot-link" style={{ marginTop: 0, marginBottom: 0 }}>
              Forgot password?
            </Link>
          </div>

          {isCurrentEmailLocked && (
            <div className="error-box" role="alert">
              {lockState.message}
              <br />
              Try again in {lockState.secondsLeft} seconds.
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading || isCurrentEmailLocked}>
            {loading && <span className="spinner" />}
            {loading ? "Signing in…" : isCurrentEmailLocked ? "Account Locked" : "Sign In"}
          </button>

          <div className="auth-divider"><span>or</span></div>

          <GoogleSignInButton onCredential={handleGoogleCredential} disabled={loading} />
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

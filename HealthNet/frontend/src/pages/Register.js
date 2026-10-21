import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiUser, FiMail, FiLock, FiEye, FiEyeOff,
  FiHome, FiMapPin, FiFileText,
} from "react-icons/fi";
import api from "../services/api";
import BrandLogo from "../components/BrandLogo";

/* ── Password Strength ──────────────────────────────────── */
function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: "Weak", color: "#ef4444", width: "25%" };
  if (score === 2) return { level: "Fair", color: "#f59e0b", width: "50%" };
  if (score === 3) return { level: "Good", color: "#0ea5e9", width: "75%" };
  return { level: "Strong", color: "#22c55e", width: "100%" };
}

function getPasswordValidationMessage(password) {
  if (!password) return "";
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(password)) return "Add at least one letter.";
  if (!/[0-9]/.test(password)) return "Add at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Add at least one special character.";
  return "";
}

export default function Register() {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.removeAttribute("data-theme");
      document.body.removeAttribute("data-theme");
    }
  }, []);

  const [form, setForm] = useState({
    username: "",
    email: "",
    city: "",
    password: "",
    confirm_password: "",
    role: "patient",
    // Hospital fields
    hospital_name: "",
    hospital_city: "",
    hospital_address: "",
    hospital_license: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);
  const passwordValidationMessage = getPasswordValidationMessage(form.password);
  const passwordsMatch =
    form.confirm_password.length === 0 || form.password === form.confirm_password;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username || !form.email || !form.password || !form.confirm_password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }
    if (passwordValidationMessage) {
      toast.error(passwordValidationMessage);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      if (data.success) {
        toast.success(data.message || "Account created! Verify your email.");
        if (data.delivery === "console" && data.debug_otp) {
          toast.info(`Debug OTP: ${data.debug_otp}`);
        }
        navigate("/verify-otp", {
          state: { contact: data.contact, purpose: "verify" },
        });
      }
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) {
        res.errors.forEach((msg) => toast.error(msg));
      } else {
        toast.error(res?.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 500 }}>
        {/* Logo */}
        <div className="auth-logo">
          <BrandLogo className="logo-icon" />
          <h1>HealthNet</h1>
          <p>Create your account</p>
        </div>

        {/* Role Selector */}
        <div className="role-selector">
          <div
            className={`role-card ${form.role === "patient" ? "active" : ""}`}
            onClick={() => setForm({ ...form, role: "patient" })}
          >
            <div className="role-icon">🧑‍⚕️</div>
            <div className="role-title">As Patient</div>
          </div>
          <div
            className={`role-card ${form.role === "hospital" ? "active" : ""}`}
            onClick={() => setForm({ ...form, role: "hospital" })}
          >
            <div className="role-icon">🏨</div>
            <div className="role-title">As Hospital</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                name="username"
                placeholder="johndoe"
                value={form.username}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* City */}
          <div className="form-group">
            <label>{form.role === "hospital" ? "Your City" : "City"}</label>
            <div className="input-wrapper">
              <FiMapPin className="input-icon" />
              <input
                name="city"
                placeholder="Enter city"
                value={form.city}
                onChange={handleChange}
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
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
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

            {/* Strength Meter */}
            {form.password && (
              <div className="password-strength">
                <div className="strength-bar-track">
                  <div
                    className="strength-bar-fill"
                    style={{ width: strength.width, background: strength.color }}
                  />
                </div>
                <div className="strength-label" style={{ color: strength.color }}>
                  {strength.level}
                </div>
              </div>
            )}
            <div className="password-hint">
              Use at least 8 characters with a letter, number, and special character.
            </div>
            {passwordValidationMessage && (
              <div className="field-error">{passwordValidationMessage}</div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showConfirm ? "text" : "password"}
                name="confirm_password"
                placeholder="Re-enter password"
                value={form.confirm_password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
              >
                {showConfirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {!passwordsMatch && (
              <div className="field-error">Passwords do not match</div>
            )}
          </div>

          {/* ── Hospital-specific fields ───────────────── */}
          {form.role === "hospital" && (
            <div className="hospital-fields">
              <h4>Hospital Details</h4>

              <div className="form-group">
                <label>Hospital Name</label>
                <div className="input-wrapper">
                  <FiHome className="input-icon" />
                  <input
                    name="hospital_name"
                    placeholder="City General Hospital"
                    value={form.hospital_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Hospital City</label>
                <div className="input-wrapper">
                  <FiMapPin className="input-icon" />
                  <input
                    name="hospital_city"
                    placeholder="Chiniot"
                    value={form.hospital_city}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <div className="input-wrapper">
                  <FiMapPin className="input-icon" />
                  <input
                    name="hospital_address"
                    placeholder="123 Medical Ave, City"
                    value={form.hospital_address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>License Number</label>
                <div className="input-wrapper">
                  <FiFileText className="input-icon" />
                  <input
                    name="hospital_license"
                    placeholder="MH-12345-LIC"
                    value={form.hospital_license}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

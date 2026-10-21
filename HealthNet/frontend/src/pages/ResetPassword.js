import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import api from "../services/api";
import BrandLogo from "../components/BrandLogo";

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

export default function ResetPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const contact = state?.contact || "";
  const code = state?.code || "";

  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.new_password);
  const passwordValidationMessage = getPasswordValidationMessage(form.new_password);
  const passwordsMatch =
    form.confirm_password.length === 0 || form.new_password === form.confirm_password;

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.removeAttribute("data-theme");
      document.body.removeAttribute("data-theme");
    }
    if (!contact || !code) navigate("/forgot-password");
  }, [contact, code, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.new_password || !form.confirm_password) {
      toast.error("Please fill in both fields.");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }
    if (passwordValidationMessage) {
      toast.error(passwordValidationMessage);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        contact,
        code,
        new_password: form.new_password,
      });
      if (data.success) {
        toast.success("Password reset successful! 🎉");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <BrandLogo className="logo-icon" />
          <h1>Set New Password</h1>
          <p>Create a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPass ? "text" : "password"}
                name="new_password"
                placeholder="Enter new password"
                value={form.new_password}
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

            {form.new_password && (
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

          <div className="form-group">
            <label>Confirm New Password</label>
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

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

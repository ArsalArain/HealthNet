import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import BrandLogo from "../components/BrandLogo";

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const contact = state?.contact || "";
  const purpose = state?.purpose || "verify";

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const inputsRef = useRef([]);

  /* ── Countdown timer ──────────────────────────────────── */
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  /* ── OTP input handling ───────────────────────────────── */
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = [...otp];
    text.split("").forEach((ch, i) => (next[i] = ch));
    setOtp(next);
    const focusIdx = Math.min(text.length, OTP_LENGTH - 1);
    inputsRef.current[focusIdx]?.focus();
  };

  /* ── Submit OTP ───────────────────────────────────────── */
  const handleVerify = useCallback(async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { contact, code, purpose });
      if (data.success) {
        toast.success("Verified successfully! 🎉");
        if (purpose === "reset") {
          navigate("/reset-password", { state: { contact, code } });
        } else {
          navigate("/login");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  }, [otp, contact, purpose, navigate]);

  /* ── Resend OTP ───────────────────────────────────────── */
  const handleResend = async () => {
    try {
      const { data } = await api.post("/auth/resend-otp", { contact, purpose });
      toast.success(data?.message || "New code sent!");
      if (data?.delivery === "console" && data?.debug_otp) {
        toast.info(`Debug OTP: ${data.debug_otp}`);
      }
      setCountdown(COUNTDOWN_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not resend code.");
    }
  };

  /* ── Redirect if no contact ───────────────────────────── */
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.removeAttribute("data-theme");
      document.body.removeAttribute("data-theme");
    }
    if (!contact) navigate("/register");
  }, [contact, navigate]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-logo">
          <BrandLogo className="logo-icon" />
          <h1>Verify Your Account</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
            We sent a 6-digit code to your email<br />
            <strong style={{ color: "#0ea5e9" }}>{contact}</strong>
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="otp-inputs" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button
          className="btn-primary"
          onClick={handleVerify}
          disabled={loading || otp.join("").length < OTP_LENGTH}
        >
          {loading && <span className="spinner" />}
          {loading ? "Verifying…" : "Verify Code"}
        </button>

        {/* Resend */}
        <div className="resend-row">
          {countdown > 0 ? (
            <span>Resend code in <strong>{formatTime(countdown)}</strong></span>
          ) : (
            <button onClick={handleResend}>Resend Code</button>
          )}
        </div>
      </div>
    </div>
  );
}

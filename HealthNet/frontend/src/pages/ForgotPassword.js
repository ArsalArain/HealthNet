import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiMail } from "react-icons/fi";
import api from "../services/api";
import BrandLogo from "../components/BrandLogo";

export default function ForgotPassword() {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.removeAttribute("data-theme");
      document.body.removeAttribute("data-theme");
    }
  }, []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      toast.success(data.message);
      if (data.debug_otp) {
        toast.info(`Dev OTP: ${data.debug_otp}`);
      }
      if (!data.contact) {
        return;
      }
      navigate("/verify-otp", {
        state: { contact: data.contact, purpose: "reset" },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <BrandLogo className="logo-icon" />
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a reset code</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Sending…" : "Send Reset Code"}
          </button>
        </form>

        <div className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

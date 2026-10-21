/**
 * StripePaymentModal.js
 *
 * A premium glassmorphism payment modal using Stripe CardElement.
 * Wraps itself in <Elements> so it can be dropped anywhere without
 * needing to wrap the parent in <Elements>.
 *
 * Props:
 *  open          (bool)   — controls visibility
 *  onClose       (fn)     — called when user cancels
 *  onSuccess     (fn)     — called with { paymentIntentId, consultationFee } on success
 *  bookingDetails (obj)   — { doctorName, department, hospitalName, date, timeSlot, consultationFee, doctorId }
 */

import React, { useCallback, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import api from "../services/api";

// Initialise Stripe once using the publishable key from .env
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || ""
);

// ─── Card Element Styling ─────────────────────────────────────────────────
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1e293b",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      fontSmoothing: "antialiased",
      "::placeholder": { color: "#94a3b8" },
      iconColor: "#6366f1",
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
  hidePostalCode: true,
};

// ─── Inner form (must be inside <Elements>) ────────────────────────────────
function PaymentForm({ bookingDetails, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();

  const [step, setStep] = useState("idle"); // idle | processing | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [cardReady, setCardReady] = useState(false);

  const { doctorName, department, hospitalName, date, timeSlot, consultationFee, doctorId } =
    bookingDetails || {};

  const formatPkr = (amount) =>
    `PKR ${Number(amount || 0).toLocaleString("en-PK")}`;

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!stripe || !elements) return;

      setStep("processing");
      setErrorMessage("");

      try {
        // 1. Create PaymentIntent on backend
        const { data } = await api.post("/payment/create-intent", {
          amount_pkr: consultationFee,
          doctor_id: doctorId,
        });

        if (!data?.clientSecret) {
          throw new Error("Failed to initialise payment. Please try again.");
        }

        // 2. Confirm card payment with Stripe
        const cardElement = elements.getElement(CardElement);
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          {
            payment_method: { card: cardElement },
          }
        );

        if (error) {
          setErrorMessage(error.message || "Card payment failed.");
          setStep("error");
          return;
        }

        if (paymentIntent?.status === "succeeded") {
          setStep("success");
          // Notify parent with the intent ID and fee so it can book appointment
          onSuccess({
            paymentIntentId: paymentIntent.id,
            consultationFee,
          });
        } else {
          setErrorMessage(`Unexpected payment status: ${paymentIntent?.status}`);
          setStep("error");
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message || err.message || "Payment failed.";
        setErrorMessage(msg);
        setStep("error");
      }
    },
    [stripe, elements, consultationFee, doctorId, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Booking Summary */}
      <div className="stripe-summary-card">
        <div className="stripe-summary-title">Appointment Summary</div>
        <div className="stripe-summary-grid">
          <div className="stripe-summary-row">
            <span className="stripe-summary-label">👨‍⚕️ Doctor</span>
            <span className="stripe-summary-value">{doctorName || "—"}</span>
          </div>
          <div className="stripe-summary-row">
            <span className="stripe-summary-label">🏥 Hospital</span>
            <span className="stripe-summary-value">{hospitalName || "—"}</span>
          </div>
          <div className="stripe-summary-row">
            <span className="stripe-summary-label">🩺 Department</span>
            <span className="stripe-summary-value">{department || "—"}</span>
          </div>
          <div className="stripe-summary-row">
            <span className="stripe-summary-label">📅 Date</span>
            <span className="stripe-summary-value">{date || "—"}</span>
          </div>
          <div className="stripe-summary-row">
            <span className="stripe-summary-label">🕐 Slot</span>
            <span className="stripe-summary-value">{timeSlot || "—"}</span>
          </div>
        </div>
        <div className="stripe-fee-banner">
          <span className="stripe-fee-label">Consultation Fee</span>
          <span className="stripe-fee-amount">{formatPkr(consultationFee)}</span>
        </div>
      </div>

      {step !== "success" && (
        <>
          {/* Card Input */}
          <div className="stripe-card-section">
            <div className="stripe-card-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Card Details (Test Mode)
            </div>
            <div className="stripe-card-element-wrapper">
              <CardElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={(e) => {
                  setCardReady(e.complete);
                  if (e.error) setErrorMessage(e.error.message);
                  else setErrorMessage("");
                }}
              />
            </div>
            <div className="stripe-test-hint">
              🧪 Use test card: <strong>4242 4242 4242 4242</strong> · Exp: <strong>12/34</strong> · CVC: <strong>123</strong>
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="stripe-error-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="stripe-actions">
            <button
              type="button"
              className="stripe-btn-cancel"
              onClick={onClose}
              disabled={step === "processing"}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="stripe-btn-pay"
              disabled={!stripe || !cardReady || step === "processing"}
            >
              {step === "processing" ? (
                <span className="stripe-spinner-row">
                  <span className="stripe-spinner" />
                  Processing…
                </span>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Pay {formatPkr(consultationFee)} Securely
                </>
              )}
            </button>
          </div>

          <div className="stripe-secure-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Secured by Stripe · 256-bit SSL encryption · TEST MODE
          </div>
        </>
      )}

      {/* Success State */}
      {step === "success" && (
        <div className="stripe-success-banner">
          <div className="stripe-success-icon">✅</div>
          <div className="stripe-success-title">Payment Successful!</div>
          <div className="stripe-success-sub">
            Your appointment is being confirmed. You'll see it in My Appointments shortly.
          </div>
        </div>
      )}
    </form>
  );
}

// ─── Modal Shell (wraps form in Elements provider) ─────────────────────────
export default function StripePaymentModal({ open, onClose, onSuccess, bookingDetails }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="stripe-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="stripe-modal-panel" role="dialog" aria-modal="true" aria-label="Payment">
        {/* Header */}
        <div className="stripe-modal-header">
          <div className="stripe-modal-title">
            <div className="stripe-modal-icon">💳</div>
            Complete Payment
          </div>
          <button
            type="button"
            className="stripe-modal-close"
            onClick={onClose}
            aria-label="Close payment modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="stripe-modal-body">
          <Elements stripe={stripePromise}>
            <PaymentForm
              bookingDetails={bookingDetails}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}

/**
 * payment.js — Stripe payment routes for HealthNet
 *
 * Endpoints:
 *  POST /api/payment/create-intent  → creates a Stripe PaymentIntent, returns clientSecret
 *  GET  /api/payment/verify/:intentId → verifies a PaymentIntent status (server-side check)
 *
 * All amounts are in PKR. Stripe requires smallest currency unit (paisa = 1/100 PKR).
 * We use currency "pkr" with amount in paisa (amount_pkr * 100).
 */

const express = require("express");
const router = express.Router();

const env = require("../config/env");
const { authenticateJWT } = require("../middleware/auth");
const Staff = require("../models/Staff");

// Lazy-initialize Stripe so the server still boots if key is missing
let stripe = null;
function getStripe() {
  if (!stripe) {
    if (!env.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured in backend .env");
    }
    // eslint-disable-next-line global-require
    stripe = require("stripe")(env.stripeSecretKey);
  }
  return stripe;
}

/**
 * POST /api/payment/create-intent
 * Body: { amount_pkr: number, doctor_id: string, metadata?: object }
 * Returns: { success, clientSecret, paymentIntentId, amount_pkr }
 */
router.post("/create-intent", authenticateJWT, async (req, res, next) => {
  try {
    const amountPkr = Number(req.body?.amount_pkr);
    const doctorId = String(req.body?.doctor_id || "").trim();

    if (!Number.isFinite(amountPkr) || amountPkr < 200 || amountPkr > 20000) {
      return res.status(400).json({
        success: false,
        message: "amount_pkr must be a number between 200 and 20000.",
      });
    }

    // Verify the doctor exists and the fee matches (anti-tampering)
    if (doctorId) {
      const doctor = await Staff.findOne(
        { _id: doctorId, role: "doctor", status: "active" },
        { consultation_fee: 1 }
      );
      if (doctor && Number.isFinite(Number(doctor.consultation_fee))) {
        const expectedFee = Number(doctor.consultation_fee);
        if (Math.abs(expectedFee - amountPkr) > 1) {
          return res.status(400).json({
            success: false,
            message: `Fee mismatch. Expected PKR ${expectedFee} for this doctor.`,
          });
        }
      }
    }

    const stripeClient = getStripe();

    // PKR is a zero-decimal currency — Stripe expects amount in paisa (1 PKR = 100 paisa)
    const amountPaisa = Math.round(amountPkr * 100);

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountPaisa,
      currency: "pkr",
      automatic_payment_methods: { enabled: true },
      metadata: {
        patient_user_id: String(req.authUser._id),
        doctor_id: doctorId || "",
        amount_pkr: String(amountPkr),
        source: "healthnet_appointment",
        ...(req.body?.metadata || {}),
      },
      description: `HealthNet consultation fee – PKR ${amountPkr}`,
    });

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount_pkr: amountPkr,
    });
  } catch (error) {
    console.error("[Payment] create-intent error:", error.message);
    if (error?.type?.startsWith("Stripe")) {
      return res.status(402).json({ success: false, message: error.message });
    }
    return next(error);
  }
});

/**
 * GET /api/payment/verify/:intentId
 * Server-side verification that a PaymentIntent actually succeeded.
 * Returns: { success, status, amount_pkr }
 */
router.get("/verify/:intentId", authenticateJWT, async (req, res, next) => {
  try {
    const intentId = String(req.params.intentId || "").trim();
    if (!intentId || !intentId.startsWith("pi_")) {
      return res.status(400).json({ success: false, message: "Invalid paymentIntentId." });
    }

    const stripeClient = getStripe();
    const intent = await stripeClient.paymentIntents.retrieve(intentId);

    return res.json({
      success: true,
      status: intent.status, // "succeeded" | "requires_payment_method" | etc.
      amount_pkr: intent.amount / 100,
      currency: intent.currency,
    });
  } catch (error) {
    console.error("[Payment] verify error:", error.message);
    if (error?.type?.startsWith("Stripe")) {
      return res.status(402).json({ success: false, message: error.message });
    }
    return next(error);
  }
});

module.exports = router;

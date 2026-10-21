const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
      index: true,
    },
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },
    appointment_at: {
      type: Date,
      required: true,
      index: true,
    },
    duration_minutes: {
      type: Number,
      default: 30,
      min: 10,
      max: 240,
    },
    reason: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    // Stripe payment fields
    payment_intent_id: { type: String, default: null, trim: true },
    payment_status: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
    consultation_fee: { type: Number, default: null }, // PKR amount paid
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    patient_feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        default: "",
        trim: true,
      },
      submitted_at: {
        type: Date,
        default: null,
      },
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

appointmentSchema.index({ hospital_id: 1, doctor_id: 1, appointment_at: 1 });
appointmentSchema.index({ hospital_id: 1, doctor_id: 1, status: 1, appointment_at: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
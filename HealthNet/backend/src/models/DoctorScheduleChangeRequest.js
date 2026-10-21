const mongoose = require("mongoose");

const doctorScheduleChangeRequestSchema = new mongoose.Schema(
  {
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
      index: true,
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },
    current_shift: { type: String, default: "", trim: true },
    current_status: { type: String, default: "", trim: true },
    current_available_days: { type: [String], default: [] },
    requested_shift: { type: String, default: "", trim: true },
    requested_status: { type: String, default: "", trim: true },
    requested_available_days: { type: [String], default: [] },
    reason: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewed_at: { type: Date, default: null },
    review_note: { type: String, default: "", trim: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

doctorScheduleChangeRequestSchema.index({ hospital_id: 1, doctor_id: 1, status: 1, created_at: -1 });

module.exports = mongoose.model("DoctorScheduleChangeRequest", doctorScheduleChangeRequestSchema);
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["doctor", "nurse", "staff", "receptionist"],
      required: true,
    },
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    doctor_id: { type: String, default: null, trim: true },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    phone: { type: String, default: "" },
    specialization: { type: String, default: "" },
    shift: { type: String, enum: ["morning", "evening", "night", "flex", ""], default: "" },
    available_days: { type: [String], default: [] },
    max_patients_per_day: { type: Number, default: null },
    consultation_fee: { type: Number, default: 500, min: 200, max: 2000 }, // PKR fee per appointment
    experience_years: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "suspended", "leave"], default: "active" },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

staffSchema.index({ hospital_id: 1, role: 1 });
staffSchema.index({ hospital_id: 1, doctor_id: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Staff", staffSchema);

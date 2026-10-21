const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "" },
    city: { type: String, default: "", trim: true },
    date_of_birth: { type: Date, default: null },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    blood_type: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      default: "",
    },
    address: { type: String, default: "" },
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    assigned_doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    medical_history: { type: String, default: "" },
    source_record_id: { type: String, default: "", trim: true },
    source_data: { type: mongoose.Schema.Types.Mixed, default: null },
    status: { type: String, enum: ["active", "discharged", "deceased"], default: "active" },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

patientSchema.index({ hospital_id: 1 });
patientSchema.index({ hospital_id: 1, status: 1 });
patientSchema.index({ assigned_doctor_id: 1 });
patientSchema.index({ hospital_id: 1, department_id: 1, source_record_id: 1 });

module.exports = mongoose.model("Patient", patientSchema);

const mongoose = require("mongoose");

const diagnosisSchema = new mongoose.Schema(
  {
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    diagnosis: { type: String, required: true, trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

diagnosisSchema.index({ hospital_id: 1, patient_id: 1, created_at: -1 });

diagnosisSchema.index({ doctor_id: 1, created_at: -1 });

module.exports = mongoose.model("Diagnosis", diagnosisSchema);

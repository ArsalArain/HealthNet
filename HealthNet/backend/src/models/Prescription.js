const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    medicines: {
      type: [String],
      required: true,
      default: [],
      set: (value) => {
        if (Array.isArray(value)) {
          return value.map((item) => String(item || "").trim()).filter(Boolean);
        }
        return String(value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      },
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one medicine is required.",
      },
    },
    dosage: { type: String, default: "", trim: true },
    instructions: { type: String, default: "", trim: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

prescriptionSchema.index({ hospital_id: 1, patient_id: 1, created_at: -1 });
prescriptionSchema.index({ doctor_id: 1, created_at: -1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);

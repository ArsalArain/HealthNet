const mongoose = require("mongoose");

const resourceValidationSchema = new mongoose.Schema(
  {
    prescription_id: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription", required: true },
    hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    resources: [
      {
        resource_id: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
        name: { type: String, required: true },
        quantity_requested: { type: Number, default: 1 },
      },
    ],
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

resourceValidationSchema.index({ hospital_id: 1, status: 1 });
resourceValidationSchema.index({ prescription_id: 1 });

module.exports = mongoose.model("ResourceValidation", resourceValidationSchema);

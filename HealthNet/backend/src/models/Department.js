const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    description: { type: String, default: "" },
    head_doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

departmentSchema.index({ hospital_id: 1 });
departmentSchema.index({ hospital_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Department", departmentSchema);

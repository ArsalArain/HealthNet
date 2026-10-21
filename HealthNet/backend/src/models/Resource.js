const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["bed", "equipment", "medicine", "room", "other"],
      required: true,
    },
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    quantity: { type: Number, default: 0, min: 0 },
    available_quantity: { type: Number, default: 0, min: 0 },
    min_quantity: { type: Number, default: 0, min: 0 },
    max_quantity: { type: Number, default: 0, min: 0 },
    category: { type: String, default: "General" },
    unit: { type: String, default: "" },
    notes: { type: String, default: "" },
    status: { type: String, default: "Medium" },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

resourceSchema.index({ hospital_id: 1 });
resourceSchema.index({ hospital_id: 1, type: 1 });
resourceSchema.index({ hospital_id: 1, status: 1 });

module.exports = mongoose.model("Resource", resourceSchema);

const mongoose = require("mongoose");

const smartSchedulePlanSchema = new mongoose.Schema(
  {
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
      index: true,
    },
    generated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    start_date: { type: String, required: true, trim: true },
    end_date: { type: String, required: true, trim: true },
    horizon_days: { type: Number, required: true, min: 1, max: 31 },
    safety_buffer_pct: { type: Number, default: 0, min: 0, max: 100 },
    department_filter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    summary: { type: mongoose.Schema.Types.Mixed, default: {} },
    alerts: { type: [mongoose.Schema.Types.Mixed], default: [] },
    departments_plan: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

smartSchedulePlanSchema.index({ hospital_id: 1, created_at: -1 });
smartSchedulePlanSchema.index({ hospital_id: 1, start_date: 1, end_date: 1, created_at: -1 });

module.exports = mongoose.model("SmartSchedulePlan", smartSchedulePlanSchema);

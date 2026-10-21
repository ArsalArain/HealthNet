const mongoose = require("mongoose");

const scheduleOptimizationProposalSchema = new mongoose.Schema(
  {
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "applied", "rejected"],
      default: "pending",
      index: true,
    },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    optimization_type: {
      type: String,
      enum: ["weekly_coverage", "load_balancing", "manual"],
      default: "weekly_coverage",
    },
    department_filter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    summary: {
      total_gaps_to_close: { type: Number, default: 0 },
      doctors_affected: { type: Number, default: 0 },
      coverage_improvement_pct: { type: Number, default: 0 },
      appointments_to_review: { type: Number, default: 0 },
    },
    changes: {
      type: [
        {
          doctor_id: mongoose.Schema.Types.ObjectId,
          doctor_name: String,
          department_id: mongoose.Schema.Types.ObjectId,
          department_name: String,
          change_type: {
            type: String,
            enum: ["assign_day", "extend_availability", "change_shift", "full_reassignment", "optimal_roster_assignment"],
          },
          from_state: mongoose.Schema.Types.Mixed,
          to_state: mongoose.Schema.Types.Mixed,
          affected_appointments: { type: Number, default: 0 },
          appointment_ids: [mongoose.Schema.Types.ObjectId],
          description: String,
        },
      ],
      default: [],
    },
    approval_feedback: { type: String, default: "", trim: true },
    applied_at: { type: Date, default: null },
    rejection_reason: { type: String, default: "", trim: true },
    rejected_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

scheduleOptimizationProposalSchema.index({ hospital_id: 1, status: 1, created_at: -1 });
scheduleOptimizationProposalSchema.index({ hospital_id: 1, created_by: 1, created_at: -1 });

module.exports = mongoose.model("ScheduleOptimizationProposal", scheduleOptimizationProposalSchema);

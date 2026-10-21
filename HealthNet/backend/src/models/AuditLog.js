const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actor_email: { type: String, default: "" },
    action: { type: String, required: true, trim: true },
    target_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    target_hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

auditLogSchema.index({ created_at: -1 });
auditLogSchema.index({ actor_user_id: 1, created_at: -1 });
auditLogSchema.index({ action: 1, created_at: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);

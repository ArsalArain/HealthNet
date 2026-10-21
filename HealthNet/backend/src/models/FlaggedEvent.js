const mongoose = require("mongoose");

const flaggedEventSchema = new mongoose.Schema(
  {
    signal_type: { type: String, required: true, trim: true },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    score: { type: Number, default: 0 },
    reasons: { type: [String], default: [] },
    status: { type: String, enum: ["open", "resolved", "dismissed"], default: "open" },
    email: { type: String, default: "" },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
    user_agent: { type: String, default: "" },
    resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolved_note: { type: String, default: "" },
    resolved_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

flaggedEventSchema.index({ status: 1, created_at: -1 });
flaggedEventSchema.index({ signal_type: 1, created_at: -1 });
flaggedEventSchema.index({ user_id: 1, created_at: -1 });
flaggedEventSchema.index({ email: 1, created_at: -1 });

module.exports = mongoose.model("FlaggedEvent", flaggedEventSchema);

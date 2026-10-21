const mongoose = require("mongoose");

const hospitalInfoSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    city: { type: String, default: "" },
    address: { type: String, default: "" },
    license_number: { type: String, default: "" },
    specializations: { type: [String], default: [] },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, default: null },
    password: { type: String, required: true },
    auth_provider: { type: String, enum: ["local", "google"], default: "local" },
    google_id: { type: String, default: undefined },
    role: { type: String, enum: ["patient", "hospital_admin", "hospital", "system_admin"], required: true },
    pending_email: { type: String, default: null },
    pending_email_requested_at: { type: Date, default: null },
    is_verified: { type: Boolean, default: false },
    is_blocked: { type: Boolean, default: false },
    failed_login_attempts: { type: Number, default: 0 },
    locked_until: { type: Date, default: null },
    last_login_at: { type: Date, default: null },
    last_seen_at: { type: Date, default: null },
    is_online: { type: Boolean, default: false },
    approval_status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    rejection_reason: { type: String, default: "" },
    hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", default: null },
    hospital_info: { type: hospitalInfoSchema, default: undefined },
    city: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    age: { type: Number, default: null, min: 0, max: 120 },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    profile_image: { type: String, default: "" }, // URL to profile image
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ google_id: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema);

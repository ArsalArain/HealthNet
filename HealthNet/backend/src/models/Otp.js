const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    contact: { type: String, required: true, index: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ["verify", "reset", "email_change"], required: true },
    expires_at: { type: Date, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

module.exports = mongoose.model("Otp", otpSchema);

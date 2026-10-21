const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, default: "", trim: true },
    address: { type: String, required: true, trim: true },
    license_number: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    contact_number: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    geo_location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

hospitalSchema.index({ email: 1 }, { unique: true });
hospitalSchema.index({ license_number: 1 }, { unique: true });
hospitalSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.model("Hospital", hospitalSchema);

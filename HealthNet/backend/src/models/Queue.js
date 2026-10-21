const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema(
  {
    hospital_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
      index: true,
    },
    queue_date: {
      type: Date,
      required: true,
      index: true,
    },
    token_number: {
      type: Number,
      required: true,
      min: 1,
    },
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["waiting", "in_progress", "served", "cancelled"],
      default: "waiting",
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

queueSchema.index({ hospital_id: 1, queue_date: 1, doctor_id: 1, token_number: 1 }, { unique: true });
queueSchema.index({ hospital_id: 1, queue_date: 1, status: 1 });

module.exports = mongoose.model("Queue", queueSchema);

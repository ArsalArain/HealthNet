const AuditLog = require("../models/AuditLog");

async function writeAuditLog({ req, actorUser, action, targetUserId = null, targetHospitalId = null, metadata = {} }) {
  try {
    const forwardedFor = String(req.headers["x-forwarded-for"] || "");
    const ip = forwardedFor.split(",")[0].trim() || req.ip || "";

    await AuditLog.create({
      actor_user_id: actorUser?._id,
      actor_email: String(actorUser?.email || ""),
      action,
      target_user_id: targetUserId,
      target_hospital_id: targetHospitalId,
      metadata,
      ip,
    });
  } catch (error) {
    console.error("[AuditLog] failed:", error.message);
  }
}

module.exports = { writeAuditLog };

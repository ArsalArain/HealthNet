const FlaggedEvent = require("../models/FlaggedEvent");

function getRequestIp(req) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "");
  return forwardedFor.split(",")[0].trim() || req.ip || "";
}

async function createFlaggedEvent(req, {
  signalType,
  severity = "medium",
  score = 0,
  reasons = [],
  email = "",
  userId = null,
  metadata = {},
}) {
  try {
    return await FlaggedEvent.create({
      signal_type: signalType,
      severity,
      score,
      reasons,
      email: String(email || ""),
      user_id: userId,
      metadata,
      ip: getRequestIp(req),
      user_agent: String(req.headers["user-agent"] || ""),
    });
  } catch (error) {
    console.error("[FlaggedEvent] failed:", error.message);
    return null;
  }
}

module.exports = {
  getRequestIp,
  createFlaggedEvent,
};

const jwt = require("jsonwebtoken");

const env = require("../config/env");
const User = require("../models/User");
const Hospital = require("../models/Hospital");
const { createFlaggedEvent } = require("../utils/flaggedEvents");

async function authenticateJWT(req, res, next) {
  try {
    const authHeader = String(req.headers.authorization || "");
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Missing or invalid authorization token." });
    }

    const token = authHeader.slice(7).trim();
    const payload = jwt.verify(token, env.jwtSecret);
    const userId = String(payload.sub || "");

    if (!userId) {
      return res.status(401).json({ success: false, message: "Invalid token payload." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found for this token." });
    }
    if (user.is_blocked) {
      return res.status(403).json({ success: false, message: "Your account has been blocked by the administrator." });
    }

    req.authUser = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ success: false, message: "Invalid authentication token." });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    const role = req.authUser?.role;
    if (!role || !roles.includes(role)) {
      void createFlaggedEvent(req, {
        signalType: "unauthorized_action_attempt",
        severity: "medium",
        score: 50,
        reasons: ["User attempted to access a restricted role route."],
        email: req.authUser?.email || "",
        userId: req.authUser?._id || null,
        metadata: {
          required_roles: roles,
          current_role: role || "unknown",
          path: req.originalUrl,
          method: req.method,
        },
      });
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    return next();
  };
}

const requireSystemAdmin = [authenticateJWT, authorizeRoles("system_admin")];
const requireHospitalAdmin = [authenticateJWT, authorizeRoles("hospital_admin")];

async function restrictToOwnHospital(req, res, next) {
  try {
    const hospitalId = req.authUser?.hospital_id;
    if (!hospitalId) {
      return res.status(403).json({ success: false, message: "No hospital associated with this account." });
    }

    // Re-verify hospital is still approved and active on every request
    const hospital = await Hospital.findById(hospitalId, { status: 1, is_active: 1 });
    if (!hospital || hospital.status !== "approved" || !hospital.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your hospital is no longer active. Contact the system administrator.",
      });
    }

    // Enforce admin account status
    if (req.authUser.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Account is suspended. Contact the system administrator.",
      });
    }

    req.hospitalId = hospitalId;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  authenticateJWT,
  authorizeRoles,
  requireSystemAdmin,
  requireHospitalAdmin,
  restrictToOwnHospital,
};

const jwt = require("jsonwebtoken");

const env = require("../config/env");
const Staff = require("../models/Staff");
const Hospital = require("../models/Hospital");

async function authenticateStaff(req, res, next) {
  try {
    const authHeader = String(req.headers.authorization || "");
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Missing or invalid authorization token." });
    }

    const token = authHeader.slice(7).trim();
    const payload = jwt.verify(token, env.jwtSecret);

    if (payload.entity !== "staff") {
      return res.status(401).json({ success: false, message: "Invalid token type for staff access." });
    }

    const staffId = String(payload.sub || "");
    if (!staffId) {
      return res.status(401).json({ success: false, message: "Invalid token payload." });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(401).json({ success: false, message: "Staff account not found for this token." });
    }
    if (staff.status === "suspended") {
      return res.status(403).json({ success: false, message: "Staff account is suspended. Contact your hospital administrator." });
    }

    const hospital = await Hospital.findById(staff.hospital_id, { status: 1, is_active: 1 });
    if (!hospital || hospital.status !== "approved" || !hospital.is_active) {
      return res.status(403).json({ success: false, message: "Your hospital is not currently active. Contact the system administrator." });
    }

    req.authStaff = staff;
    req.hospitalId = staff.hospital_id;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ success: false, message: "Invalid authentication token." });
  }
}

function authorizeStaffRoles(...roles) {
  return (req, res, next) => {
    const role = req.authStaff?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    return next();
  };
}

// Alias to keep middleware naming consistent with role-based checks in other modules.
const authorizeRoles = authorizeStaffRoles;

const requireDoctor = [authenticateStaff, authorizeStaffRoles("doctor")];
const requireNurse = [authenticateStaff, authorizeStaffRoles("nurse")];
const requireAnyStaff = [authenticateStaff];

module.exports = {
  authenticateStaff,
  authorizeRoles,
  authorizeStaffRoles,
  requireDoctor,
  requireNurse,
  requireAnyStaff,
};

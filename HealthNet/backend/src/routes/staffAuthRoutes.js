const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Staff = require("../models/Staff");
const Hospital = require("../models/Hospital");
const env = require("../config/env");
const { isValidEmail, normalizeEmail, validatePassword } = require("../utils/validators");
const { authenticateStaff, requireAnyStaff } = require("../middleware/staffAuth");

const router = express.Router();

function createStaffToken(staff) {
  return jwt.sign(
    {
      sub: String(staff._id),
      name: staff.name,
      role: staff.role,
      hospital_id: String(staff.hospital_id),
      entity: "staff",
    },
    env.jwtSecret,
    { expiresIn: "24h" }
  );
}

// ---------------------------------------------------------------------------
// PUBLIC
// ---------------------------------------------------------------------------

// POST /api/staff-auth/login — Staff member login (doctor / nurse / receptionist / staff)
router.post("/login", async (req, res, next) => {
  try {
    const rawEmail = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "");

    if (!rawEmail || !isValidEmail(rawEmail)) {
      return res.status(400).json({ success: false, message: "A valid email is required." });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }

    const email = normalizeEmail(rawEmail);
    const staff = await Staff.findOne({ email });

    // Use identical error message for both "not found" and "wrong password" to prevent email enumeration
    if (!staff) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    if (staff.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Account is suspended. Contact your hospital administrator.",
      });
    }

    const hospital = await Hospital.findById(staff.hospital_id, { status: 1, is_active: 1, name: 1 });
    if (!hospital || hospital.status !== "approved" || !hospital.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your hospital is not currently active. Contact the system administrator.",
      });
    }

    const valid = await bcrypt.compare(password, staff.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const token = createStaffToken(staff);

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: String(staff._id),
        name: staff.name,
        email: staff.email,
        role: staff.role,
        phone: staff.phone,
        specialization: staff.specialization,
        department_id: staff.department_id ? String(staff.department_id) : null,
        hospital_id: String(staff.hospital_id),
        hospital_name: hospital.name,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// PROTECTED — requires valid staff JWT
// ---------------------------------------------------------------------------

// GET /api/staff-auth/profile — Logged-in staff member's profile
router.get("/profile", ...requireAnyStaff, async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.authStaff._id, { password: 0, __v: 0 })
      .populate("department_id", "name status")
      .populate("hospital_id", "name city email phone contact_number status");

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff account not found." });
    }

    return res.json({ success: true, profile: staff });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/staff-auth/profile — Update phone and/or password
router.put("/profile", ...requireAnyStaff, async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.authStaff._id);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff account not found." });
    }

    let updated = false;

    if (req.body?.phone !== undefined) {
      staff.phone = String(req.body.phone || "").trim();
      updated = true;
    }

    if (req.body?.password !== undefined) {
      const passwordError = validatePassword(String(req.body.password));
      if (passwordError) {
        return res.status(400).json({ success: false, message: passwordError });
      }
      if (!req.body?.current_password) {
        return res.status(400).json({ success: false, message: "current_password is required to change your password." });
      }
      const valid = await bcrypt.compare(String(req.body.current_password), staff.password);
      if (!valid) {
        return res.status(401).json({ success: false, message: "Current password is incorrect." });
      }
      staff.password = await bcrypt.hash(String(req.body.password), 10);
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({ success: false, message: "No fields to update. Provide phone or password." });
    }

    await staff.save();

    return res.json({
      success: true,
      message: "Profile updated.",
      profile: {
        id: String(staff._id),
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

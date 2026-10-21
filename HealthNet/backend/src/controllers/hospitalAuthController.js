const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const User = require("../models/userModel");
const Hospital = require("../models/hospitalModel");
const { isValidEmail, normalizeEmail, validatePassword } = require("../utils/validators");
const { parseHospitalLocation } = require("../utils/hospitalLocation");

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildEmailQuery(email) {
  const normalized = normalizeEmail(email);
  return {
    email: { $regex: `^${escapeRegex(normalized)}$`, $options: "i" },
  };
}

function buildHospitalLicenseNumber() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PENDING-${Date.now()}-${suffix}`;
}

function buildToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      username: user.username,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: "24h" }
  );
}

async function registerHospitalAdmin(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      hospital_name,
      city,
      address,
      contact_number,
      description,
    } = req.body || {};

    const adminName = String(name || "").trim();
    const adminEmail = normalizeEmail(email || "");
    const adminPassword = String(password || "");
    const hospitalName = String(hospital_name || "").trim();
    const hospitalCity = String(city || "").trim();
    const hospitalAddress = String(address || "").trim();
    const hospitalContact = String(contact_number || "").trim();
    const hospitalDescription = String(description || "").trim();
    const geoLocation = parseHospitalLocation(req.body || {});

    if (!adminName || !adminEmail || !adminPassword || !hospitalName || !hospitalCity || !hospitalAddress || !hospitalContact) {
      return res.status(400).json({
        success: false,
        message: "name, email, password, hospital_name, city, address, and contact_number are required.",
      });
    }

    if (!isValidEmail(adminEmail)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }

    const passwordError = validatePassword(adminPassword);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const existingUser = await User.findOne(buildEmailQuery(adminEmail));
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already exists." });
    }

    const licenseNumber = buildHospitalLicenseNumber();
    const hospital = await Hospital.create({
      name: hospitalName,
      city: hospitalCity,
      address: hospitalAddress,
      contact_number: hospitalContact,
      description: hospitalDescription,
      geo_location: geoLocation || { lat: null, lng: null },
      status: "pending",
      is_active: false,
      email: adminEmail,
      phone: hospitalContact,
      license_number: licenseNumber,
      created_by: null,
    });

    let hospitalAdmin;
    try {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      hospitalAdmin = await User.create({
        username: adminName,
        email: adminEmail,
        password: passwordHash,
        role: "hospital_admin",
        hospital_id: hospital._id,
        approval_status: "pending",
        is_verified: true,
        is_blocked: false,
        auth_provider: "local",
        hospital_info: {
          name: hospitalName,
          address: hospitalAddress,
          license_number: licenseNumber,
          specializations: [],
        },
      });
    } catch (creationError) {
      await Hospital.deleteOne({ _id: hospital._id });
      throw creationError;
    }

    return res.status(201).json({
      success: true,
      message: "Hospital registration submitted. Awaiting system admin approval.",
      data: {
        hospital_admin: {
          id: String(hospitalAdmin._id),
          name: hospitalAdmin.username,
          email: hospitalAdmin.email,
          role: hospitalAdmin.role,
          hospital_id: String(hospital._id),
        },
        hospital: {
          id: String(hospital._id),
          hospital_name: hospital.name,
          city: hospital.city,
          address: hospital.address,
          contact_number: hospital.contact_number || hospital.phone,
          description: hospital.description,
          status: hospital.status,
          createdAt: hospital.created_at,
        },
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "Duplicate hospital registration data." });
    }
    return next(error);
  }
}

async function loginHospitalAdmin(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email || "");
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne(buildEmailQuery(email));
    if (!user || user.role !== "hospital_admin") {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const hospital = user.hospital_id ? await Hospital.findById(user.hospital_id) : null;
    if (!hospital) {
      return res.status(403).json({ success: false, message: "Hospital profile not linked. Contact system administrator." });
    }

    if (hospital.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: `Hospital registration is ${hospital.status}. Login is allowed only after approval.`,
        hospital_status: hospital.status,
      });
    }

    if (user.approval_status !== "approved") {
      return res.status(403).json({
        success: false,
        message: `Hospital admin account is ${user.approval_status}. Contact system administrator.`,
        approval_status: user.approval_status,
      });
    }

    if (user.is_blocked) {
      return res.status(403).json({ success: false, message: "Account is blocked. Contact system administrator." });
    }

    user.last_login_at = new Date();
    user.last_seen_at = new Date();
    user.is_online = true;
    await user.save();

    const token = buildToken(user);
    return res.json({
      success: true,
      message: "Hospital admin login successful.",
      token,
      user: {
        id: String(user._id),
        name: user.username,
        email: user.email,
        role: user.role,
        hospital_id: String(hospital._id),
      },
      hospital: {
        id: String(hospital._id),
        hospital_name: hospital.name,
        status: hospital.status,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  registerHospitalAdmin,
  loginHospitalAdmin,
};

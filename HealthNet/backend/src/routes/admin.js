const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Hospital = require("../models/Hospital");
const AuditLog = require("../models/AuditLog");
const FlaggedEvent = require("../models/FlaggedEvent");
const { isValidEmail, normalizeEmail } = require("../utils/validators");
const { requireSystemAdmin } = require("../middleware/auth");
const { writeAuditLog } = require("../utils/adminAudit");
const { parseHospitalLocation } = require("../utils/hospitalLocation");

const router = express.Router();

router.use(...requireSystemAdmin);

router.get("/users", async (_req, res, next) => {
  try {
    const users = await User.find({ is_verified: true }, {
      password: 0,
      __v: 0,
    }).populate("hospital_id", "name email license_number is_active").sort({ created_at: -1 });

    return res.json({ success: true, users });
  } catch (error) {
    return next(error);
  }
});

router.delete("/user/:id", async (req, res, next) => {
  try {
    const userId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (targetUser.role === "system_admin") {
      return res.status(403).json({ success: false, message: "System admin cannot be deleted or blocked." });
    }

    const action = String(req.query.action || "block").trim().toLowerCase();
    if (action === "delete") {
      await User.deleteOne({ _id: targetUser._id });
      await writeAuditLog({
        req,
        actorUser: req.authUser,
        action: "user_delete",
        targetUserId: targetUser._id,
        metadata: { target_email: targetUser.email || "", target_role: targetUser.role },
      });
      return res.json({ success: true, message: "User deleted successfully.", action: "delete" });
    }

    if (action === "unblock") {
      targetUser.is_blocked = false;
      await targetUser.save();
      await writeAuditLog({
        req,
        actorUser: req.authUser,
        action: "user_unblock",
        targetUserId: targetUser._id,
        metadata: { target_email: targetUser.email || "", target_role: targetUser.role },
      });
      return res.json({ success: true, message: "User unblocked successfully.", action: "unblock" });
    }

    targetUser.is_blocked = true;
    await targetUser.save();
    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "user_block",
      targetUserId: targetUser._id,
      metadata: { target_email: targetUser.email || "", target_role: targetUser.role },
    });
    return res.json({ success: true, message: "User blocked successfully.", action: "block" });
  } catch (error) {
    return next(error);
  }
});

router.post("/hospital", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const address = String(req.body?.address || "").trim();
    const licenseNumber = String(req.body?.license_number || "").trim();
    const email = normalizeEmail(req.body?.email || "");
    const phone = String(req.body?.phone || "").trim();
    const geoLocation = parseHospitalLocation(req.body || {});

    if (!name || !address || !licenseNumber || !email) {
      return res.status(400).json({ success: false, message: "Name, address, license number and email are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid hospital email address." });
    }

    const duplicate = await Hospital.findOne({
      $or: [{ email }, { license_number: licenseNumber }],
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: "Hospital with same email or license already exists." });
    }

    const hospital = await Hospital.create({
      name,
      address,
      license_number: licenseNumber,
      email,
      phone,
      geo_location: geoLocation || { lat: null, lng: null },
      created_by: req.authUser._id,
      is_active: true,
    });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_create",
      targetHospitalId: hospital._id,
      metadata: { hospital_name: hospital.name, hospital_email: hospital.email },
    });

    return res.status(201).json({ success: true, message: "Hospital added successfully.", hospital });
  } catch (error) {
    return next(error);
  }
});

router.put("/hospital/:id", async (req, res, next) => {
  try {
    const hospitalId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ success: false, message: "Invalid hospital id." });
    }

    const updates = {};
    if (req.body?.name !== undefined) updates.name = String(req.body.name || "").trim();
    if (req.body?.address !== undefined) updates.address = String(req.body.address || "").trim();
    if (req.body?.license_number !== undefined) updates.license_number = String(req.body.license_number || "").trim();
    if (req.body?.phone !== undefined) updates.phone = String(req.body.phone || "").trim();
    const geoLocation = parseHospitalLocation(req.body || {});
    if (geoLocation) updates.geo_location = geoLocation;
    if (req.body?.email !== undefined) {
      const normalizedEmail = normalizeEmail(req.body.email || "");
      if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
        return res.status(400).json({ success: false, message: "Invalid hospital email address." });
      }
      updates.email = normalizedEmail;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided for update." });
    }

    if (updates.email || updates.license_number) {
      const duplicateQuery = {
        _id: { $ne: hospitalId },
        $or: [],
      };
      if (updates.email) duplicateQuery.$or.push({ email: updates.email });
      if (updates.license_number) duplicateQuery.$or.push({ license_number: updates.license_number });
      const duplicate = await Hospital.findOne(duplicateQuery);
      if (duplicate) {
        return res.status(409).json({ success: false, message: "Hospital with same email or license already exists." });
      }
    }

    const hospital = await Hospital.findByIdAndUpdate(hospitalId, { $set: updates }, { new: true });
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found." });
    }

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_update",
      targetHospitalId: hospital._id,
      metadata: { updates },
    });

    return res.json({ success: true, message: "Hospital updated successfully.", hospital });
  } catch (error) {
    return next(error);
  }
});

router.delete("/hospital/:id", async (req, res, next) => {
  try {
    const hospitalId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ success: false, message: "Invalid hospital id." });
    }

    const hospital = await Hospital.findByIdAndDelete(hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found." });
    }

    await User.updateMany({ hospital_id: hospital._id }, { $set: { hospital_id: null, approval_status: "pending" } });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_delete",
      targetHospitalId: hospital._id,
      metadata: { hospital_name: hospital.name, hospital_email: hospital.email },
    });

    return res.json({ success: true, message: "Hospital deleted successfully." });
  } catch (error) {
    return next(error);
  }
});

router.get("/hospitals", async (_req, res, next) => {
  try {
    const hospitals = await Hospital.find({}).sort({ created_at: -1 });
    return res.json({ success: true, hospitals });
  } catch (error) {
    return next(error);
  }
});

router.patch("/hospital/:id/toggle", async (req, res, next) => {
  try {
    const hospitalId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ success: false, message: "Invalid hospital id." });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found." });
    }

    hospital.is_active = !hospital.is_active;
    await hospital.save();

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: hospital.is_active ? "hospital_activate" : "hospital_deactivate",
      targetHospitalId: hospital._id,
      metadata: { hospital_name: hospital.name },
    });

    return res.json({
      success: true,
      message: `Hospital ${hospital.is_active ? "activated" : "deactivated"} successfully.`,
      hospital,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/hospital-admins/pending", async (_req, res, next) => {
  try {
    const users = await User.find(
      { role: "hospital_admin", approval_status: "pending" },
      { password: 0, __v: 0 }
    ).sort({ created_at: -1 });

    return res.json({ success: true, users });
  } catch (error) {
    return next(error);
  }
});

router.get("/hospital-admins/rejected", async (_req, res, next) => {
  try {
    const users = await User.find(
      { role: "hospital_admin", approval_status: "rejected" },
      { password: 0, __v: 0 }
    ).sort({ updated_at: -1 });

    return res.json({ success: true, users });
  } catch (error) {
    return next(error);
  }
});

router.post("/hospital-admin/:id/approve", async (req, res, next) => {
  try {
    const userId = String(req.params.id || "").trim();
    const hospitalId = String(req.body?.hospital_id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }

    const hospitalAdmin = await User.findById(userId);

    if (!hospitalAdmin) {
      return res.status(404).json({ success: false, message: "Hospital admin user not found." });
    }
    if (hospitalAdmin.role !== "hospital_admin") {
      return res.status(400).json({ success: false, message: "User is not a hospital admin account." });
    }

    let hospital = null;

    if (hospitalId) {
      if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        return res.status(400).json({ success: false, message: "Invalid hospital_id." });
      }
      hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
        return res.status(404).json({ success: false, message: "Hospital not found." });
      }
    } else {
      const info = hospitalAdmin.hospital_info || {};
      const name = String(info.name || "").trim();
      const city = String(info.city || "").trim();
      const address = String(info.address || "").trim();
      const licenseNumber = String(info.license_number || "").trim();
      const email = normalizeEmail(hospitalAdmin.email || "");

      if (!name || !address || !licenseNumber || !email || !isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Hospital form data is incomplete. Provide hospital_id or ensure hospital details exist in the request.",
        });
      }

      hospital = await Hospital.findOne({
        $or: [{ email }, { license_number: licenseNumber }],
      });

      if (!hospital) {
        hospital = await Hospital.create({
          name,
          city,
          address,
          license_number: licenseNumber,
          email,
          phone: "",
          is_active: true,
          created_by: req.authUser._id,
        });
      }
    }

    hospitalAdmin.approval_status = "approved";
    hospitalAdmin.hospital_id = hospital._id;
    hospitalAdmin.is_blocked = false;
    hospitalAdmin.rejection_reason = "";
    await hospitalAdmin.save();

    hospital.status = "approved";
    hospital.is_active = true;
    await hospital.save();

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_approve",
      targetUserId: hospitalAdmin._id,
      targetHospitalId: hospital._id,
      metadata: { target_email: hospitalAdmin.email || "" },
    });

    return res.json({
      success: true,
      message: "Hospital admin approved successfully.",
      user: hospitalAdmin,
      hospital,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/hospital-admin/:id/reject", async (req, res, next) => {
  try {
    const userId = String(req.params.id || "").trim();
    const reason = String(req.body?.reason || "Not approved by system admin").trim();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }

    const hospitalAdmin = await User.findById(userId);
    if (!hospitalAdmin) {
      return res.status(404).json({ success: false, message: "Hospital admin user not found." });
    }
    if (hospitalAdmin.role !== "hospital_admin") {
      return res.status(400).json({ success: false, message: "User is not a hospital admin account." });
    }

    hospitalAdmin.approval_status = "rejected";
    hospitalAdmin.rejection_reason = reason;
    hospitalAdmin.is_blocked = false;
    await hospitalAdmin.save();

    if (hospitalAdmin.hospital_id) {
      const linkedHospital = await Hospital.findById(hospitalAdmin.hospital_id);
      if (linkedHospital) {
        linkedHospital.status = "rejected";
        linkedHospital.is_active = false;
        await linkedHospital.save();
      }
    }

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_reject",
      targetUserId: hospitalAdmin._id,
      metadata: { target_email: hospitalAdmin.email || "", reason },
    });

    return res.json({
      success: true,
      message: "Hospital admin request rejected.",
      user: hospitalAdmin,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/stats", async (_req, res, next) => {
  try {
    const appointmentsModel = mongoose.models.Appointment;

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      onlineUsers,
      offlineUsers,
      totalHospitals,
      activeHospitals,
      pendingHospitalAdmins,
      appointments,
      lockedAccounts,
      usersWithFailedAttempts,
      rejectedHospitalAdmins,
      recentAuditEvents,
      openFlaggedEvents,
      highSeverityOpenFlags,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: { $ne: "system_admin" }, is_blocked: { $ne: true } }),
      User.countDocuments({ role: { $ne: "system_admin" }, is_blocked: true }),
      User.countDocuments({ role: { $ne: "system_admin" }, is_online: true }),
      User.countDocuments({ role: { $ne: "system_admin" }, is_online: false }),
      Hospital.countDocuments({}),
      Hospital.countDocuments({ is_active: true }),
      User.countDocuments({ role: "hospital_admin", approval_status: "pending" }),
      appointmentsModel ? appointmentsModel.countDocuments({}) : Promise.resolve(0),
      User.countDocuments({ locked_until: { $gt: new Date() } }),
      User.countDocuments({ failed_login_attempts: { $gt: 0 } }),
      User.countDocuments({ role: "hospital_admin", approval_status: "rejected" }),
      AuditLog.countDocuments({ created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      FlaggedEvent.countDocuments({ status: "open" }),
      FlaggedEvent.countDocuments({ status: "open", severity: "high" }),
    ]);

    return res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          blocked: blockedUsers,
          online: onlineUsers,
          offline: offlineUsers,
        },
        hospitals: {
          total: totalHospitals,
          active: activeHospitals,
        },
        approvals: {
          pending_hospital_admins: pendingHospitalAdmins,
        },
        suspicious: {
          locked_accounts: lockedAccounts,
          users_with_failed_attempts: usersWithFailedAttempts,
          rejected_hospital_admins: rejectedHospitalAdmins,
          recent_audit_events_24h: recentAuditEvents,
          open_flagged_events: openFlaggedEvents,
          high_severity_open_flags: highSeverityOpenFlags,
        },
        appointments,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/flagged-events", async (req, res, next) => {
  try {
    const status = String(req.query.status || "open").trim().toLowerCase();
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100)));
    const query = {};
    if (["open", "resolved", "dismissed"].includes(status)) {
      query.status = status;
    }

    const events = await FlaggedEvent.find(query, { __v: 0 })
      .sort({ created_at: -1 })
      .limit(limit)
      .populate("user_id", "username email role")
      .populate("resolved_by", "username email role");

    return res.json({ success: true, events });
  } catch (error) {
    return next(error);
  }
});

router.patch("/flagged-events/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id || "").trim();
    const status = String(req.body?.status || "").trim().toLowerCase();
    const note = String(req.body?.note || "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid flagged event id." });
    }
    if (!["resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be resolved or dismissed." });
    }

    const event = await FlaggedEvent.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Flagged event not found." });
    }

    event.status = status;
    event.resolved_by = req.authUser._id;
    event.resolved_note = note;
    event.resolved_at = new Date();
    await event.save();

    // Resolve: clear the user's lockout and failed-attempt counter so they can log in again
    let userUnlocked = false;
    if (status === "resolved" && event.user_id) {
      const affectedUser = await User.findById(event.user_id);
      if (affectedUser && (affectedUser.failed_login_attempts > 0 || affectedUser.locked_until)) {
        affectedUser.failed_login_attempts = 0;
        affectedUser.locked_until = null;
        await affectedUser.save();
        userUnlocked = true;
      }
    }

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "flagged_event_update",
      targetUserId: event.user_id || null,
      metadata: { flagged_event_id: String(event._id), status, note, signal_type: event.signal_type, user_unlocked: userUnlocked },
    });

    const message = status === "resolved"
      ? userUnlocked
        ? "Flag resolved — user lockout cleared and login attempts reset."
        : "Flag resolved."
      : "Flag dismissed — no account changes made.";

    return res.json({ success: true, message, event, user_unlocked: userUnlocked });
  } catch (error) {
    return next(error);
  }
});

router.get("/audit-logs", async (req, res, next) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
    const logs = await AuditLog.find({}, { __v: 0 })
      .sort({ created_at: -1 })
      .limit(limit)
      .populate("actor_user_id", "username email role")
      .populate("target_user_id", "username email role")
      .populate("target_hospital_id", "name email license_number");

    return res.json({ success: true, logs });
  } catch (error) {
    return next(error);
  }
});

// POST /api/admin/hospital-admin — System admin directly creates a hospital admin for an approved hospital
router.post("/hospital-admin", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const rawEmail = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    const hospitalId = String(req.body?.hospital_id || "").trim();
    const phone = String(req.body?.phone || "").trim();

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!rawEmail || !isValidEmail(rawEmail)) {
      return res.status(400).json({ success: false, message: "A valid email is required." });
    }
    if (!hospitalId || !mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ success: false, message: "A valid hospital_id is required." });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found." });
    }
    if (hospital.status !== "approved") {
      return res.status(400).json({ success: false, message: "Hospital must be approved before creating admin accounts." });
    }

    const email = normalizeEmail(rawEmail);
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "A user with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await User.create({
      username: name,
      email,
      password: hashedPassword,
      role: "hospital_admin",
      auth_provider: "local",
      is_verified: true,
      approval_status: "approved",
      hospital_id: hospital._id,
      phone,
      status: "active",
    });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_create",
      targetUserId: newAdmin._id,
      targetHospitalId: hospital._id,
      metadata: { target_email: email, hospital_name: hospital.name },
    });

    return res.status(201).json({
      success: true,
      message: "Hospital admin account created successfully.",
      user: {
        id: String(newAdmin._id),
        name: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        phone: newAdmin.phone,
        hospital_id: String(hospital._id),
        hospital_name: hospital.name,
        status: newAdmin.status,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

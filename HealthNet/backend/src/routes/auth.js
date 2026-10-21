const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const fs = require("fs");
const path = require("path");
const { parse: parseCsv } = require("csv-parse/sync");

const env = require("../config/env");
const User = require("../models/User");
const Otp = require("../models/Otp");
const {
  validateRegistration,
  buildUserPayload,
  isValidEmail,
  normalizeEmail,
  validatePassword,
} = require("../utils/validators");
const { sendOtpEmail } = require("../utils/mailer");
const { assessRegistrationRisk } = require("../utils/riskEngine");
const { getRequestIp, createFlaggedEvent } = require("../utils/flaggedEvents");
const { authenticateJWT } = require("../middleware/auth");

const router = express.Router();
const googleClient = new OAuth2Client();

const LOGIN_RATE_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_RATE_LIMIT = 20;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;
const loginAttemptBuckets = new Map();
const BACKEND_ROOT_DIR = path.resolve(__dirname, "..", "..");
const STORAGE_ROOT_DIR = path.join(BACKEND_ROOT_DIR, "storage");

function ensureDirectorySync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toCsv(rows, columns) {
  const escapeCell = (value) => {
    const raw = value === undefined || value === null ? "" : String(value);
    if (/[,"]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const header = columns.map((c) => escapeCell(c)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCell(row[c])).join(","));
  return [header, ...lines].join("\n");
}

function readCsvRows(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  if (!raw.trim()) return [];
  const rows = parseCsv(raw, { columns: true, skip_empty_lines: true, trim: true });
  return Array.isArray(rows) ? rows : [];
}

function getPatientAccountsDataPaths() {
  const dir = path.join(STORAGE_ROOT_DIR, "patient_records", "system");
  return {
    dir,
    csv: path.join(dir, "patient_accounts.csv"),
    ndjson: path.join(dir, "patient_accounts.ndjson"),
  };
}

function syncPatientAccountDataFile(user) {
  if (!user || String(user.role || "") !== "patient") return;

  const paths = getPatientAccountsDataPaths();
  ensureDirectorySync(paths.dir);

  const columns = [
    "user_id",
    "username",
    "email",
    "phone",
    "city",
    "auth_provider",
    "status",
    "is_verified",
    "created_at",
    "updated_at",
  ];

  const record = {
    user_id: String(user._id),
    username: String(user.username || ""),
    email: String(user.email || ""),
    phone: String(user.phone || ""),
    city: String(user.city || ""),
    auth_provider: String(user.auth_provider || "local"),
    status: String(user.status || "active"),
    is_verified: user.is_verified ? "true" : "false",
    created_at: user.created_at ? new Date(user.created_at).toISOString() : "",
    updated_at: user.updated_at ? new Date(user.updated_at).toISOString() : "",
  };

  const rows = readCsvRows(paths.csv);
  const existingIdx = rows.findIndex((r) => String(r.user_id || "") === String(record.user_id));
  if (existingIdx >= 0) {
    rows[existingIdx] = { ...rows[existingIdx], ...record };
  } else {
    rows.push(record);
  }

  fs.writeFileSync(paths.csv, toCsv(rows, columns), "utf-8");
  fs.writeFileSync(paths.ndjson, rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""), "utf-8");
}

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const existing = loginAttemptBuckets.get(ip) || { count: 0, resetAt: now + LOGIN_RATE_WINDOW_MS };

  if (now > existing.resetAt) {
    existing.count = 0;
    existing.resetAt = now + LOGIN_RATE_WINDOW_MS;
  }

  existing.count += 1;
  loginAttemptBuckets.set(ip, existing);

  if (existing.count > LOGIN_RATE_LIMIT) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { blocked: true, retryAfterSeconds };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function expiresAtDate() {
  return new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);
}

function findQueryFromEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return {
    email: { $regex: `^${escapeRegex(normalizedEmail)}$`, $options: "i" },
  };
}

function createToken(user) {
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

function buildAuthResponse(user, token, message = "Login successful.") {
  return {
    success: true,
    message,
    token,
    user: {
      id: String(user._id),
      username: user.username,
      role: user.role,
      email: user.email,
      auth_provider: user.auth_provider,
      hospital_id: user.hospital_id ? String(user.hospital_id) : null,
    },
  };
}

function buildGoogleUsername(profile) {
  const base = String(profile.name || profile.email || "user")
    .trim()
    .replace(/\s+/g, " ");

  return base.length >= 3 ? base : `user-${Date.now()}`;
}

function assessViolationReport(details) {
  const text = String(details || "").toLowerCase();
  const severeTerms = ["fraud", "threat", "harass", "abuse", "scam", "impersonat", "stolen"];
  const mediumTerms = ["spam", "misuse", "unauthorized", "insult", "fake"];

  let score = 20;
  const reasons = [];

  if (severeTerms.some((term) => text.includes(term))) {
    score += 40;
    reasons.push("Severe policy violation keywords detected.");
  }
  if (mediumTerms.some((term) => text.includes(term))) {
    score += 20;
    reasons.push("Moderate policy violation keywords detected.");
  }

  const severity = score >= 60 ? "high" : score >= 35 ? "medium" : "low";
  return { score, severity, reasons };
}

router.post("/register-admin", async (req, res, next) => {
  try {
    const data = req.body || {};
    const email = normalizeEmail(data.email || "");
    const username = String(data.username || "system_admin").trim();
    const password = String(data.password || "");

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Valid admin email is required." });
    }
    if (email !== normalizeEmail(env.systemAdminEmail)) {
      return res.status(403).json({
        success: false,
        message: `Only configured system admin email (${env.systemAdminEmail}) is allowed.`,
      });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const existingSystemAdmin = await User.findOne({ role: "system_admin" });
    if (existingSystemAdmin) {
      return res.status(409).json({ success: false, message: "System admin account already exists." });
    }

    const duplicateEmail = await User.findOne(findQueryFromEmail(email));
    if (duplicateEmail) {
      return res.status(409).json({ success: false, message: "Email already in use." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const systemAdmin = await User.create({
      username: username || "system_admin",
      email,
      password: passwordHash,
      role: "system_admin",
      approval_status: "approved",
      is_verified: !env.adminOtpVerification,
      auth_provider: "local",
    });

    if (env.adminOtpVerification) {
      const otpCode = generateOtpCode();
      await Otp.create({
        contact: email,
        code: otpCode,
        purpose: "verify",
        expires_at: expiresAtDate(),
      });

      // Send OTP email and WAIT for it on admin registration (critical operation)
          const otpDelivery = await sendOtpEmail(email, otpCode, "HealthNet - Your Verification Code");
      
      if (!otpDelivery?.delivered) {
        console.error("[HealthNet] OTP delivery failed on admin registration:", otpDelivery?.message);
        await Otp.deleteMany({ contact: email, purpose: "verify" });
        await User.deleteOne({ _id: systemAdmin._id });
        return res.status(503).json({
          success: false,
          message: "Failed to send verification email. Please verify SMTP configuration and try again.",
          delivery: otpDelivery?.delivery || "failed",
        });
      }

      return res.status(201).json({
        success: true,
        message: "System admin account created. Verify OTP sent to email.",
        contact: email,
        user_id: String(systemAdmin._id),
      });
    }

    return res.status(201).json({
      success: true,
      message: "System admin account created successfully.",
      user_id: String(systemAdmin._id),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const data = req.body || {};
    const ip = getRequestIp(req);
    const registrationRisk = assessRegistrationRisk({
      email: normalizeEmail(data.email || data.email_or_phone || ""),
      username: data.username,
      ip,
      userAgent: req.headers["user-agent"],
      honeypot: data.website,
    });

    if (registrationRisk.shouldFlag) {
      await createFlaggedEvent(req, {
        signalType: "suspicious_registration",
        severity: registrationRisk.severity,
        score: registrationRisk.score,
        reasons: registrationRisk.reasons,
        email: normalizeEmail(data.email || data.email_or_phone || ""),
        metadata: { username: data.username || "" },
      });
    }

    const errors = validateRegistration(data);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const email = normalizeEmail(data.email || data.email_or_phone);
    const query = findQueryFromEmail(email);

    const existing = await User.findOne(query);
    if (existing) {
      if (existing.is_verified) {
        return res.status(409).json({ success: false, errors: ["Account already exists."] });
      }
      await User.deleteOne({ _id: existing._id });
      await Otp.deleteMany({ contact: email });
    }

    const password = await bcrypt.hash(String(data.password), 10);
    const user = new User({
      ...buildUserPayload(data),
      password,
      is_verified: false,
      is_blocked: registrationRisk.shouldAutoBlock,
    });
    await user.save();

    if (registrationRisk.shouldAutoBlock) {
      await createFlaggedEvent(req, {
        signalType: "auto_block_registration",
        severity: "high",
        score: registrationRisk.score,
        reasons: registrationRisk.reasons,
        email,
        userId: user._id,
      });
      return res.status(403).json({
        success: false,
        message: "Registration is temporarily restricted due to risk signals. Contact support.",
      });
    }

    const otpCode = generateOtpCode();
    await Otp.create({
      contact: email,
      code: otpCode,
      purpose: "verify",
      expires_at: expiresAtDate(),
    });

    // Send OTP email and WAIT for it on initial registration (critical operation)
      const otpDelivery = await sendOtpEmail(email, otpCode, "HealthNet - Your Verification Code");
    
    if (!otpDelivery?.delivered) {
      console.error("[HealthNet] OTP delivery failed on registration:", otpDelivery?.message);
      await Otp.deleteMany({ contact: email, purpose: "verify" });
      await User.deleteOne({ _id: user._id });
      return res.status(503).json({
        success: false,
        message: "Failed to send verification email. Please check your email address and try again.",
        delivery: otpDelivery?.delivery || "failed",
      });
    }

    syncPatientAccountDataFile(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful. OTP sent to your email for verification.",
      contact: email,
      delivery: "email",
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/verify-otp", async (req, res, next) => {
  try {
    const contact = normalizeEmail(req.body?.contact || req.body?.email || "");
    const code = String(req.body?.code || "").trim();
    const purpose = String(req.body?.purpose || "verify").trim();

    if (!contact || !code) {
      return res.status(400).json({ success: false, message: "Email and OTP code are required." });
    }

    const otp = await Otp.findOne({ contact, code, purpose }).sort({ created_at: -1 });
    if (!otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP code." });
    }
    if (new Date() > otp.expires_at) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (purpose === "verify") {
      const query = findQueryFromEmail(contact);
      await User.updateOne(query, { $set: { is_verified: true, updated_at: new Date() } });
    }

    if (purpose === "verify") {
      await Otp.deleteMany({ contact, purpose });
    }
    return res.json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    return next(error);
  }
});

router.post("/resend-otp", async (req, res, next) => {
  try {
    const contact = normalizeEmail(req.body?.contact || req.body?.email || "");
    const purpose = String(req.body?.purpose || "verify").trim();

    if (!contact) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const otpCode = generateOtpCode();
    await Otp.create({
      contact,
      code: otpCode,
      purpose,
      expires_at: expiresAtDate(),
    });

    const subject = purpose === "verify"
      ? "HealthNet - Your Verification Code"
      : "HealthNet - Password Reset Code";

    // Send OTP email and WAIT for it (to ensure delivery for critical operations)
    const otpDelivery = await sendOtpEmail(contact, otpCode, subject);

    if (!otpDelivery?.delivered) {
      console.error("[HealthNet] OTP delivery failed on resend:", otpDelivery?.message);
      return res.status(503).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
        delivery: otpDelivery?.delivery || "failed",
      });
    }

    return res.json({
      success: true,
      message: "New OTP sent successfully.",
      delivery: "email",
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email || req.body?.email_or_phone || "");
    const password = String(req.body?.password || "");
    const ip = getRequestIp(req);

    const rateLimit = checkLoginRateLimit(ip);
    if (rateLimit.blocked) {
      return res.status(429).json({
        success: false,
        message: `Too many login attempts from this network. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
        retry_after_seconds: rateLimit.retryAfterSeconds,
      });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const query = findQueryFromEmail(email);
    const user = await User.findOne(query);

    if (!user) {
      await createFlaggedEvent(req, {
        signalType: "failed_login_unknown_email",
        severity: "low",
        score: 20,
        reasons: ["Login attempted with unknown email."],
        email,
      });
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }
    if (user.role === "hospital_admin" && user.approval_status === "rejected") {
      return res.status(403).json({
        success: false,
        message: user.rejection_reason || "Hospital registration request was rejected by system admin.",
      });
    }
    if (user.role === "hospital_admin" && user.approval_status === "pending") {
      return res.status(403).json({
        success: false,
        message: "Hospital admin account pending approval by system admin.",
      });
    }
    if (user.is_blocked) {
      await createFlaggedEvent(req, {
        signalType: "blocked_user_login_attempt",
        severity: "medium",
        score: 45,
        reasons: ["Blocked account attempted to login."],
        email,
        userId: user._id,
      });
      return res.status(403).json({ success: false, message: "Account is blocked. Contact system administrator." });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ success: false, message: "Account is suspended. Contact your hospital administrator." });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingSeconds = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 1000);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked due to repeated failed logins. Try again in ${remainingSeconds} seconds.`,
        retry_after_seconds: remainingSeconds,
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      user.failed_login_attempts = Number(user.failed_login_attempts || 0) + 1;
      let reasons = ["Incorrect password."];
      let severity = "low";
      let score = 25;
      if (user.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        user.locked_until = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
        user.failed_login_attempts = 0;
        reasons = ["Account locked due to repeated failed logins."];
        severity = "high";
        score = 80;
      }
      await user.save();

      await createFlaggedEvent(req, {
        signalType: user.locked_until ? "account_locked_failed_logins" : "failed_login_password",
        severity,
        score,
        reasons,
        email,
        userId: user._id,
        metadata: { remaining_attempt_window: MAX_FAILED_LOGIN_ATTEMPTS },
      });
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    if (user.failed_login_attempts || user.locked_until) {
      user.failed_login_attempts = 0;
      user.locked_until = null;
      await user.save();
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Account not verified. Please verify your email first.",
        needs_verification: true,
        contact: email,
      });
    }

    user.last_login_at = new Date();
    user.last_seen_at = new Date();
    user.is_online = true;
    await user.save();

    const token = createToken(user);

    return res.json(buildAuthResponse(user, token));
  } catch (error) {
    return next(error);
  }
});

router.post("/google", async (req, res, next) => {
  try {
    if (!env.googleClientId) {
      return res.status(503).json({ success: false, message: "Google sign-in is not configured." });
    }

    const credential = String(req.body?.credential || "").trim();
    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential is required." });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ success: false, message: "Google account email is not verified." });
    }

    const email = normalizeEmail(payload.email);
    const query = findQueryFromEmail(email);
    let user = await User.findOne(query);

    if (!user) {
      const password = await bcrypt.hash(`google:${payload.sub}:${env.jwtSecret}`, 10);
      user = await User.create({
        username: buildGoogleUsername(payload),
        email,
        password,
        role: "patient",
        is_verified: true,
        auth_provider: "google",
        google_id: payload.sub,
      });
    } else {
      if (user.role === "hospital_admin" && user.approval_status === "rejected") {
        return res.status(403).json({
          success: false,
          message: user.rejection_reason || "Hospital registration request was rejected by system admin.",
        });
      }
      if (user.role === "hospital_admin" && user.approval_status === "pending") {
        return res.status(403).json({
          success: false,
          message: "Hospital admin account pending approval by system admin.",
        });
      }
      if (user.is_blocked) {
        return res.status(403).json({ success: false, message: "Account is blocked. Contact system administrator." });
      }

      if (user.failed_login_attempts || user.locked_until) {
        user.failed_login_attempts = 0;
        user.locked_until = null;
      }

      user.auth_provider = "google";
      user.google_id = payload.sub;
      user.is_verified = true;
      if (!user.email) {
        user.email = email;
      }
      if (!user.username) {
        user.username = buildGoogleUsername(payload);
      }
      user.last_login_at = new Date();
      user.last_seen_at = new Date();
      user.is_online = true;
      await user.save();
    }

    if (!user.last_login_at) {
      user.last_login_at = new Date();
      user.last_seen_at = new Date();
      user.is_online = true;
      await user.save();
    }

    syncPatientAccountDataFile(user);

    const token = createToken(user);
    return res.json(buildAuthResponse(user, token, "Google sign-in successful."));
  } catch (error) {
    return next(error);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const contact = normalizeEmail(req.body?.email || req.body?.email_or_phone || "");

    if (!contact || !isValidEmail(contact)) {
      return res.status(400).json({ success: false, message: "A valid email is required." });
    }

    const query = findQueryFromEmail(contact);
    const user = await User.findOne(query);

    if (!user) {
      return res.json({ success: true, message: "If an account exists, a reset code has been sent." });
    }

    const otpCode = generateOtpCode();
    await Otp.create({
      contact,
      code: otpCode,
      purpose: "reset",
      expires_at: expiresAtDate(),
    });

    // Send OTP email and WAIT for it (critical for password reset)
    const otpDelivery = await sendOtpEmail(contact, otpCode, "HealthNet - Password Reset Code");
    
    if (!otpDelivery?.delivered) {
      console.error("[HealthNet] OTP delivery failed on forgot-password:", otpDelivery?.message);
      await Otp.deleteMany({ contact, purpose: "reset" });
      return res.status(503).json({
        success: false,
        message: "Failed to send password reset email. Please try again.",
        delivery: otpDelivery?.delivery || "failed",
      });
    }

    return res.json({
      success: true,
      message: "If an account exists, a reset code has been sent.",
      contact,
      delivery: "email",
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const contact = normalizeEmail(req.body?.contact || req.body?.email || "");
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.new_password || "");

    if (!contact || !code || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, code and new password are required." });
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const otp = await Otp.findOne({ contact, code, purpose: "reset" }).sort({ created_at: -1 });
    if (!otp) {
      return res.status(400).json({ success: false, message: "Invalid reset code." });
    }
    if (new Date() > otp.expires_at) {
      return res.status(400).json({ success: false, message: "Reset code has expired." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const query = findQueryFromEmail(contact);
    await User.updateOne(query, {
      $set: {
        password: passwordHash,
        auth_provider: "local",
        updated_at: new Date(),
      },
    });
    await Otp.deleteMany({ contact, purpose: "reset" });

    return res.json({ success: true, message: "Password reset successful. You can now log in." });
  } catch (error) {
    return next(error);
  }
});

router.post("/report-policy-violation", authenticateJWT, async (req, res, next) => {
  try {
    const category = String(req.body?.category || "misuse").trim().toLowerCase();
    const details = String(req.body?.details || "").trim();
    const targetEmail = normalizeEmail(req.body?.target_email || "");

    if (!details || details.length < 10) {
      return res.status(400).json({ success: false, message: "Details must be at least 10 characters." });
    }

    const assessed = assessViolationReport(details);
    await createFlaggedEvent(req, {
      signalType: "policy_violation_report",
      severity: assessed.severity,
      score: assessed.score,
      reasons: assessed.reasons.length > 0 ? assessed.reasons : ["User submitted policy violation report."],
      email: targetEmail,
      userId: req.authUser._id,
      metadata: {
        reporter_email: req.authUser.email || "",
        category,
        details,
        target_email: targetEmail,
      },
    });

    return res.json({ success: true, message: "Report submitted to admin moderation queue." });
  } catch (error) {
    return next(error);
  }
});

router.post("/presence/heartbeat", authenticateJWT, async (req, res, next) => {
  try {
    await User.updateOne(
      { _id: req.authUser._id },
      {
        $set: {
          is_online: true,
          last_seen_at: new Date(),
        },
      }
    );

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/presence/offline", authenticateJWT, async (req, res, next) => {
  try {
    await User.updateOne(
      { _id: req.authUser._id },
      {
        $set: {
          is_online: false,
          last_seen_at: new Date(),
        },
      }
    );

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/profile", authenticateJWT, async (req, res, next) => {
  try {
    const user = await User.findById(req.authUser._id, {
      password: 0,
      failed_login_attempts: 0,
      locked_until: 0,
      __v: 0,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({ success: true, profile: user });
  } catch (error) {
    return next(error);
  }
});

router.put("/profile", authenticateJWT, async (req, res, next) => {
  try {
    const user = await User.findById(req.authUser._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    let updated = false;

    if (req.body?.username !== undefined) {
      const username = String(req.body.username || "").trim();
      if (username.length < 3) {
        return res.status(400).json({ success: false, message: "Name must be at least 3 characters." });
      }
      user.username = username;
      updated = true;
    }

    if (req.body?.phone !== undefined) {
      user.phone = String(req.body.phone || "").trim();
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({ success: false, message: "No profile fields provided to update." });
    }

    await user.save();
    syncPatientAccountDataFile(user);

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      profile: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        auth_provider: user.auth_provider,
        status: user.status,
        is_verified: user.is_verified,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        last_seen_at: user.last_seen_at,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/profile/request-email-change", authenticateJWT, async (req, res, next) => {
  try {
    const user = await User.findById(req.authUser._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const nextEmail = normalizeEmail(req.body?.email || "");
    if (!nextEmail || !isValidEmail(nextEmail)) {
      return res.status(400).json({ success: false, message: "A valid new email is required." });
    }

    if (String(user.email || "").toLowerCase() === nextEmail) {
      return res.status(400).json({ success: false, message: "New email must be different from current email." });
    }

    const existing = await User.findOne(findQueryFromEmail(nextEmail), { _id: 1 });
    if (existing && String(existing._id) !== String(user._id)) {
      return res.status(409).json({ success: false, message: "This email is already in use." });
    }

    const currentEmail = normalizeEmail(user.email || "");
    if (!currentEmail || !isValidEmail(currentEmail)) {
      return res.status(400).json({ success: false, message: "Current account email is invalid. Contact support." });
    }

    const otpCode = generateOtpCode();
    await Otp.deleteMany({ contact: currentEmail, purpose: "email_change" });
    await Otp.create({
      contact: currentEmail,
      code: otpCode,
      purpose: "email_change",
      expires_at: expiresAtDate(),
    });

    user.pending_email = nextEmail;
    user.pending_email_requested_at = new Date();
    await user.save();

    const otpDelivery = await sendOtpEmail(currentEmail, otpCode, "HealthNet - Confirm Email Change Request");

    const delivery = otpDelivery?.delivery || "failed";
    if (delivery === "failed") {
      return res.status(503).json({
        success: false,
        message: "Could not send email change OTP. Please try again later.",
      });
    }
    const debugOtp = delivery === "console" && env.nodeEnv !== "production" ? otpCode : undefined;

    return res.json({
      success: true,
      message: delivery === "console"
        ? "SMTP is not configured. Email change OTP is printed in backend console logs."
        : "OTP sent to your current email. Verify to complete email update.",
      delivery,
      ...(debugOtp ? { debug_otp: debugOtp } : {}),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/profile/verify-email-change", authenticateJWT, async (req, res, next) => {
  try {
    const user = await User.findById(req.authUser._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const nextEmail = normalizeEmail(req.body?.email || user.pending_email || "");
    const code = String(req.body?.code || "").trim();
    const currentEmail = normalizeEmail(user.email || "");

    if (!nextEmail || !code) {
      return res.status(400).json({ success: false, message: "Email and OTP code are required." });
    }

    if (String(user.pending_email || "").toLowerCase() !== nextEmail) {
      return res.status(400).json({ success: false, message: "No pending email change found for this email." });
    }

    const otp = await Otp.findOne({ contact: currentEmail, code, purpose: "email_change" }).sort({ created_at: -1 });
    if (!otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP code." });
    }
    if (new Date() > otp.expires_at) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    const existing = await User.findOne(findQueryFromEmail(nextEmail), { _id: 1 });
    if (existing && String(existing._id) !== String(user._id)) {
      return res.status(409).json({ success: false, message: "This email is already in use." });
    }

    user.email = nextEmail;
    user.pending_email = null;
    user.pending_email_requested_at = null;
    user.is_verified = true;
    await user.save();
    syncPatientAccountDataFile(user);
    await Otp.deleteMany({ contact: currentEmail, purpose: "email_change" });

    return res.json({
      success: true,
      message: "Email updated successfully.",
      profile: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        auth_provider: user.auth_provider,
        status: user.status,
        is_verified: user.is_verified,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        last_seen_at: user.last_seen_at,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/validate-token", authenticateJWT, async (req, res, next) => {
  try {
    // Get fresh user data from database
    const user = await User.findById(req.authUser._id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    // Return fresh user data so frontend can sync storage on page refresh
    return res.json({
      success: true,
      user: {
        id: String(user._id),
        username: user.username,
        role: user.role,
        email: user.email,
        auth_provider: user.auth_provider,
        hospital_id: user.hospital_id ? String(user.hospital_id) : null,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

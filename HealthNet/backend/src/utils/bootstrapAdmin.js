const bcrypt = require("bcryptjs");

const env = require("../config/env");
const User = require("../models/User");
const { normalizeEmail, isValidEmail, validatePassword } = require("./validators");

async function ensureSystemAdmin() {
  const adminEmail = normalizeEmail(env.systemAdminEmail);
  const adminPassword = String(env.systemAdminPassword || "");

  if (!adminEmail || !isValidEmail(adminEmail)) {
    console.warn("[HealthNet] SYSTEM_ADMIN_EMAIL is missing or invalid. Skipping system admin bootstrap.");
    return;
  }

  const existingAdmin = await User.findOne({ role: "system_admin" });
  if (existingAdmin) {
    return;
  }

  if (!adminPassword) {
    console.warn("[HealthNet] SYSTEM_ADMIN_PASSWORD is missing. Skipping system admin bootstrap.");
    return;
  }

  const passwordError = validatePassword(adminPassword);
  if (passwordError) {
    console.warn(`[HealthNet] SYSTEM_ADMIN_PASSWORD is invalid: ${passwordError}`);
    return;
  }

  const existingEmail = await User.findOne({ email: adminEmail });
  if (existingEmail) {
    console.warn("[HealthNet] SYSTEM_ADMIN_EMAIL is already used by another account. Skipping bootstrap.");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await User.create({
    username: "System Admin",
    email: adminEmail,
    password: passwordHash,
    role: "system_admin",
    auth_provider: "local",
    is_verified: true,
    approval_status: "approved",
    is_blocked: false,
  });

  console.log(`[HealthNet] System admin bootstrapped with email: ${adminEmail}`);
}

module.exports = {
  ensureSystemAdmin,
};

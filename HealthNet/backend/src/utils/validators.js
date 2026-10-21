function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[\w.+-]+@[\w-]+\.[\w.]+$/.test(email);
}

function validatePassword(password) {
  const value = String(password || "");

  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[A-Za-z]/.test(value)) {
    return "Password must include at least one letter.";
  }
  if (!/[0-9]/.test(value)) {
    return "Password must include at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return "Password must include at least one special character.";
  }

  return "";
}

function validateRegistration(data = {}) {
  const errors = [];

  if (!data.username || String(data.username).trim().length < 3) {
    errors.push("Username must be at least 3 characters.");
  }

  if (!String(data.city || "").trim()) {
    errors.push("City is required.");
  }

  const email = normalizeEmail(data.email || data.email_or_phone);
  if (!email) {
    errors.push("Email is required.");
  } else if (!isValidEmail(email)) {
    errors.push("Invalid email address.");
  }

  const password = String(data.password || "");
  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.push(passwordError);
  }

  if (data.password !== data.confirm_password) {
    errors.push("Passwords do not match.");
  }

  const role = String(data.role || "").trim();
  if (!["patient", "hospital", "hospital_admin"].includes(role)) {
    errors.push("Role must be 'patient' or 'hospital'.");
  }

  if (["hospital", "hospital_admin"].includes(role)) {
    if (!data.hospital_name) {
      errors.push("Hospital name is required.");
    }
    if (!data.hospital_address) {
      errors.push("Hospital address is required.");
    }
    if (!data.hospital_license) {
      errors.push("Hospital license number is required.");
    }
    if (!String(data.hospital_city || data.city || "").trim()) {
      errors.push("Hospital city is required.");
    }
  }

  return errors;
}

function buildUserPayload(data = {}) {
  const email = normalizeEmail(data.email || data.email_or_phone);
  const requestedRole = String(data.role || "").trim();
  const normalizedRole = requestedRole === "hospital" ? "hospital_admin" : requestedRole;
  const approvalStatus = normalizedRole === "hospital_admin" ? "pending" : "approved";

  const payload = {
    username: String(data.username || "").trim(),
    email,
    role: normalizedRole,
    approval_status: approvalStatus,
    city: String(data.city || "").trim(),
  };

  if (payload.role === "hospital_admin") {
    payload.hospital_info = {
      name: String(data.hospital_name || "").trim(),
      city: String(data.hospital_city || data.city || "").trim(),
      address: String(data.hospital_address || "").trim(),
      license_number: String(data.hospital_license || "").trim(),
      specializations: Array.isArray(data.specializations) ? data.specializations : [],
    };
  }

  return payload;
}

module.exports = {
  isValidEmail,
  normalizeEmail,
  validatePassword,
  validateRegistration,
  buildUserPayload,
};

const jwt = require("jsonwebtoken");

const env = require("../config/env");
const User = require("../models/userModel");

async function verifyToken(req, res, next) {
  try {
    const authHeader = String(req.headers.authorization || "");
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Missing or invalid authorization token." });
    }

    const token = authHeader.slice(7).trim();
    const decoded = jwt.verify(token, env.jwtSecret);
    const userId = String(decoded.sub || "");

    if (!userId) {
      return res.status(401).json({ success: false, message: "Invalid token payload." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found for this token." });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ success: false, message: "Invalid authentication token." });
  }
}

function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    return next();
  };
}

module.exports = {
  verifyToken,
  authorizeRole,
};

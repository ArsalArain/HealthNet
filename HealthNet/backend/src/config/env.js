const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/healthnet",
  jwtSecret: process.env.JWT_SECRET_KEY || "healthnet-dev-secret",
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 5),
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  systemAdminEmail: process.env.SYSTEM_ADMIN_EMAIL || "healthnet022@gmail.com",
  systemAdminPassword: process.env.SYSTEM_ADMIN_PASSWORD || "",
  adminOtpVerification: String(process.env.ADMIN_OTP_VERIFICATION || "false").toLowerCase() === "true",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  mail: {
    host: process.env.MAIL_SERVER || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_USE_TLS || "true").toLowerCase() === "false",
    user: process.env.MAIL_USERNAME || "",
    pass: process.env.MAIL_PASSWORD || "",
    from: process.env.MAIL_DEFAULT_SENDER || process.env.MAIL_USERNAME || "",
  },
};

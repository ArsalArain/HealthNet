const nodemailer = require("nodemailer");
const env = require("../config/env");

let cachedTransporter = null;

function canSendMail() {
  return Boolean(env.mail.user && env.mail.pass && env.mail.from);
}

function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: {
        user: env.mail.user,
        pass: env.mail.pass,
      },
      pool: true,
      maxConnections: 1,
      maxMessages: 20,
    });
  }

  return cachedTransporter;
}

async function sendMailWithRetry(transporter, message, attempts = 2) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await transporter.sendMail(message);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError;
}

async function sendOtpEmail(to, code, subject = "HealthNet - OTP Code") {
  console.log(`[HealthNet] Sending OTP email to ${to}.`);

  if (!canSendMail()) {
    console.log("[HealthNet] Email suppressed (SMTP not configured).");
    return {
      delivered: false,
      delivery: "console",
      errorCode: "SMTP_NOT_CONFIGURED",
      message: "SMTP is not configured.",
    };
  }

  const transporter = getTransporter();
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#0ea5e9,#10b981);padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;">HealthNet</h1>
      </div>
      <div style="padding:32px;text-align:center;">
        <p style="font-size:16px;color:#374151;">Your verification code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0ea5e9;margin:20px 0;">${code}</div>
        <p style="font-size:13px;color:#9ca3af;">This code expires in <strong>${env.otpExpiryMinutes} minutes</strong>.</p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;">
        <p style="font-size:12px;color:#9ca3af;margin:0;">If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;

  try {
    await sendMailWithRetry(transporter, {
      from: env.mail.from,
      to,
      subject,
      html,
    });
    console.log(`[HealthNet] Email sent to ${to} successfully.`);
    return {
      delivered: true,
      delivery: "email",
    };
  } catch (error) {
    console.error("[HealthNet] Email send failed:", error.message);
    return {
      delivered: false,
      delivery: "failed",
      errorCode: "SMTP_SEND_FAILED",
      message: error.message,
    };
  }
}

module.exports = {
  canSendMail,
  sendOtpEmail,
};

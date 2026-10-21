const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "tempmail.com",
  "trashmail.com",
  "yopmail.com",
]);

const SIGNUP_WINDOW_MS = 30 * 60 * 1000;
const SIGNUP_LIMIT_PER_IP = 3;
const signupBucket = new Map();

function emailDomain(email) {
  const value = String(email || "");
  const index = value.lastIndexOf("@");
  if (index < 0) return "";
  return value.slice(index + 1).toLowerCase();
}

function bumpBucket(map, key, windowMs) {
  const now = Date.now();
  const existing = map.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > existing.resetAt) {
    existing.count = 0;
    existing.resetAt = now + windowMs;
  }

  existing.count += 1;
  map.set(key, existing);
  return existing.count;
}

function assessRegistrationRisk({ email, username, ip, userAgent, honeypot }) {
  const reasons = [];
  let score = 0;

  const domain = emailDomain(email);
  if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    score += 40;
    reasons.push("Disposable email domain detected.");
  }

  const signupsFromIp = bumpBucket(signupBucket, String(ip || "unknown"), SIGNUP_WINDOW_MS);
  if (signupsFromIp > SIGNUP_LIMIT_PER_IP) {
    score += 25;
    reasons.push("High signup velocity from same IP.");
  }

  const name = String(username || "").toLowerCase();
  if (/^(test|temp|user|admin)[0-9_\-]*$/.test(name) || /(asdf|qwerty|spam)/.test(name)) {
    score += 15;
    reasons.push("Suspicious username pattern.");
  }

  if (String(honeypot || "").trim()) {
    score += 80;
    reasons.push("Honeypot field was filled.");
  }

  const agent = String(userAgent || "").toLowerCase();
  if (/postman|curl|python|bot|crawler|spider/.test(agent)) {
    score += 20;
    reasons.push("Automation-like user agent detected.");
  }

  let severity = "low";
  if (score >= 70) severity = "high";
  else if (score >= 35) severity = "medium";

  return {
    score,
    severity,
    reasons,
    shouldFlag: score >= 20,
    shouldAutoBlock: score >= 70,
  };
}

module.exports = {
  assessRegistrationRisk,
};

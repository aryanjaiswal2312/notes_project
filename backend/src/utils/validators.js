export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function isStrongPassword(password) {
  return typeof password === "string" && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function cleanString(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

export function cleanArray(value, maxItems = 20) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanString(item, 80)).filter(Boolean).slice(0, maxItems);
  }

  return String(value || "")
    .split(",")
    .map((item) => cleanString(item, 80))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function profileCompletion(profile = {}) {
  const fields = ["fullName", "email", "phone", "address", "bio", "avatarUrl"];
  const completed = fields.filter((field) => Boolean(String(profile[field] || "").trim())).length;
  return Math.round((completed / fields.length) * 100);
}

export function requireFields(body, fields) {
  const missing = fields.filter((field) => !String(body[field] || "").trim());
  if (missing.length) {
    const label = missing.join(", ");
    const error = new Error(`Missing required field${missing.length > 1 ? "s" : ""}: ${label}`);
    error.status = 400;
    throw error;
  }
}

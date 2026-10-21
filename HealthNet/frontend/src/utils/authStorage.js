const TOKEN_KEY = "healthnet_token";
const USER_KEY = "healthnet_user";
const PERSISTENT_TOKEN_KEY = "healthnet_persistent_token";
const PERSISTENT_USER_KEY = "healthnet_persistent_user";
const REMEMBER_KEY = "healthnet_remember_me";
const REMEMBERED_EMAIL_KEY = "healthnet_remembered_email";

function safeParseUser(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

export function getAuthToken() {
  // Session storage is tab-scoped, allowing different accounts in different tabs.
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

export function getAuthUser() {
  const rawUser = sessionStorage.getItem(USER_KEY);
  if (!rawUser) return null;
  const parsed = safeParseUser(rawUser);
  return Object.keys(parsed).length > 0 ? parsed : null;
}

export function setAuthSession(token, user, remember = false) {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);

  // Always store active auth in this tab only.
  sessionStorage.setItem(TOKEN_KEY, String(token || ""));
  sessionStorage.setItem(USER_KEY, JSON.stringify(user || {}));

  localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");

  // Optional persistent snapshot used only to hydrate a brand-new tab when remember-me is enabled.
  if (remember) {
    localStorage.setItem(PERSISTENT_TOKEN_KEY, String(token || ""));
    localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(user || {}));
  } else {
    localStorage.removeItem(PERSISTENT_TOKEN_KEY);
    localStorage.removeItem(PERSISTENT_USER_KEY);
  }
}

export function clearAuthSession() {
  const currentToken = sessionStorage.getItem(TOKEN_KEY) || "";
  const persistedToken = localStorage.getItem(PERSISTENT_TOKEN_KEY) || "";

  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);

  // Clear remembered auth only if it belongs to the same session being logged out.
  if (currentToken && persistedToken && currentToken === persistedToken) {
    localStorage.removeItem(PERSISTENT_TOKEN_KEY);
    localStorage.removeItem(PERSISTENT_USER_KEY);
    localStorage.setItem(REMEMBER_KEY, "false");
  }

  // Systematic cleanup of the dark/light theme attributes to restore light login page.
  if (typeof document !== "undefined") {
    document.documentElement.removeAttribute("data-theme");
    document.body.removeAttribute("data-theme");
  }
}

export function hydrateAuthSessionFromPersistent() {
  const existingToken = sessionStorage.getItem(TOKEN_KEY);
  if (existingToken) return;

  if (localStorage.getItem(REMEMBER_KEY) !== "true") return;

  const persistentToken = localStorage.getItem(PERSISTENT_TOKEN_KEY) || "";
  const persistentUser = localStorage.getItem(PERSISTENT_USER_KEY) || "";
  if (!persistentToken || !persistentUser) return;

  sessionStorage.setItem(TOKEN_KEY, persistentToken);
  sessionStorage.setItem(USER_KEY, persistentUser);
}

export function getRememberPreference() {
  return localStorage.getItem(REMEMBER_KEY) === "true";
}

export function getRememberedEmail() {
  return localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
}

export function setRememberedEmail(email, enabled) {
  if (enabled) {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, String(email || ""));
    return;
  }
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
}

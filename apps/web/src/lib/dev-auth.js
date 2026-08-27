export const LOCAL_AUTH_COOKIE = "k12-local-auth";
export const LOCAL_ACCOUNTS_KEY = "k12-local-accounts";

export function isLocalDevAuthEnabled() {
  return true;
}

export function readLocalAccounts() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeLocalAccounts(accounts) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getLocalAccount(username) {
  return readLocalAccounts()[username] ?? null;
}

export function upsertLocalAccount(username, updates = {}) {
  const trimmedUsername = String(username ?? "").trim();
  if (!trimmedUsername) return null;

  const accounts = readLocalAccounts();
  const previous = accounts[trimmedUsername] ?? {};
  const nextAccount = {
    ...previous,
    username: trimmedUsername,
    ...updates,
    canvasAccessKey: updates.canvasAccessKey ?? previous.canvasAccessKey ?? "",
    canvasSchoolUrl: updates.canvasSchoolUrl ?? previous.canvasSchoolUrl ?? "",
  };

  accounts[trimmedUsername] = nextAccount;
  writeLocalAccounts(accounts);
  return nextAccount;
}

export function setLocalDevSession(username, rememberMe = true) {
  if (typeof document === "undefined") return;

  const expires = rememberMe
    ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toUTCString()
    : new Date(Date.now() + 1000 * 60 * 60).toUTCString();

  document.cookie = `${LOCAL_AUTH_COOKIE}=${encodeURIComponent(username)}; path=/; expires=${expires}; SameSite=Lax`;

  if (rememberMe) {
    window.localStorage.setItem(LOCAL_AUTH_COOKIE, username);
  } else {
    window.sessionStorage.setItem(LOCAL_AUTH_COOKIE, username);
  }
}

export function clearLocalDevSession() {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCAL_AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LOCAL_AUTH_COOKIE);
    window.sessionStorage.removeItem(LOCAL_AUTH_COOKIE);
  }
}

export function getLocalDevSessionUsername() {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${LOCAL_AUTH_COOKIE}=`));

  if (match) {
    return decodeURIComponent(match.split("=")[1] || "");
  }

  if (typeof window === "undefined") return null;

  const localValue = window.localStorage.getItem(LOCAL_AUTH_COOKIE) || window.sessionStorage.getItem(LOCAL_AUTH_COOKIE);
  return localValue || null;
}

export function getLocalDevUser() {
  const username = getLocalDevSessionUsername();
  return {
    id: username || "local-dev-user",
    email: `${username || "local"}@local.k12planner`,
    user_metadata: {
      full_name: username || "Local User",
      username: username || "local",
    },
    app_metadata: {},
  };
}

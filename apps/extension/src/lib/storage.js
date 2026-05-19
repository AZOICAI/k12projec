const SETTINGS_KEY = "settings";
const SESSION_KEY = "session";

export async function getSettings() {
  const { settings } = await chrome.storage.sync.get(SETTINGS_KEY);
  return settings ?? null;
}

export async function setSettings(settings) {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}

export async function getSession() {
  const { session } = await chrome.storage.session.get(SESSION_KEY);
  return session ?? null;
}

export async function setSession(session) {
  if (session) {
    await chrome.storage.session.set({ [SESSION_KEY]: session });
  } else {
    await chrome.storage.session.remove(SESSION_KEY);
  }
}

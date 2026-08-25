import { countDueSoon } from "./lib/api";
import { getSession, getSettings } from "./lib/storage";

async function refreshBadge() {
  try {
    const settings = await getSettings();
    const session = await getSession();
    if (!settings?.appUrl || !session?.access_token) {
      await chrome.action.setBadgeText({ text: "" });
      return;
    }
    const n = await countDueSoon();
    await chrome.action.setBadgeText({ text: n > 0 ? String(n) : "" });
    await chrome.action.setBadgeBackgroundColor({ color: "#D97706" });
  } catch {
    await chrome.action.setBadgeText({ text: "" });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("dueSoon", { periodInMinutes: 30 });
  void refreshBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dueSoon") void refreshBadge();
});

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "session" || area === "sync") void refreshBadge();
});

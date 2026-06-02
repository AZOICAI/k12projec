import { fetchWorkSnapshot } from "./lib/api";
import { fetchCanvasDashboardData } from "./lib/canvasDashboard";
import { getSession, getSettings } from "./lib/storage";

const PENDING_TITLE_KEY = "pendingQuickAddTitle";
const PENDING_SOURCE_KEY = "pendingQuickAddSource";
const PENDING_DUE_KEY = "pendingQuickAddDue";

async function notificationsEnabled() {
  const settings = await getSettings();
  return settings?.extensionNotificationsEnabled === true;
}

async function refreshBadge() {
  try {
    const settings = await getSettings();
    const session = await getSession();
    if (!settings?.appUrl || !session?.access_token) {
      await chrome.action.setBadgeText({ text: "" });
      return;
    }
    const { totalUrgent, overdue } = await fetchWorkSnapshot();
    const n = totalUrgent;
    await chrome.action.setBadgeText({ text: n > 0 ? String(n) : "" });
    await chrome.action.setBadgeBackgroundColor({
      color: overdue.length > 0 ? "#DC2626" : "#D97706",
    });

    if (n > 0 && (await notificationsEnabled())) {
      chrome.notifications.create("due-soon", {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "K12 Planner",
        message:
          overdue.length > 0
            ? `${overdue.length} overdue, ${n - overdue.length} due soon`
            : `${n} assignment(s) need attention`,
      });
    }
  } catch {
    await chrome.action.setBadgeText({ text: "" });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("dueSoon", { periodInMinutes: 30 });
  chrome.contextMenus.create({
    id: "save-assignment-selection",
    title: "Save to K12 Planner",
    contexts: ["selection"],
  });
  void refreshBadge();
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "save-assignment-selection" || !info.selectionText) return;
  await chrome.storage.session.set({
    [PENDING_TITLE_KEY]: info.selectionText.trim().slice(0, 500),
    [PENDING_SOURCE_KEY]: info.pageUrl ?? null,
  });
  chrome.action.openPopup?.();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dueSoon") void refreshBadge();
});

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "session" || area === "sync") void refreshBadge();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "openPopup") {
    chrome.action.openPopup?.();
    return false;
  }

  if (msg?.type === "GET_CANVAS_DASHBOARD") {
    void (async () => {
      try {
        const settings = await getSettings();
        const session = await getSession();
        if (!settings?.appUrl || !session?.access_token) {
          sendResponse({
            ok: false,
            error: "Not signed in. Open K12 Planner extension Options and sign in.",
          });
          return;
        }
        const data = await fetchCanvasDashboardData();
        sendResponse({ ok: true, data });
      } catch (e) {
        sendResponse({
          ok: false,
          error: e instanceof Error ? e.message : "Failed to load dashboard",
        });
      }
    })();
    return true;
  }

  return false;
});

export { PENDING_TITLE_KEY, PENDING_SOURCE_KEY, PENDING_DUE_KEY };

/**
 * Canvas LMS: inject nav toggle + mount Command Center sidebar (shadow DOM).
 * Does not modify Canvas layout flow — panel is position:fixed overlay.
 */

const HOST_ID = "k12-planner-canvas-root";
const TOGGLE_ID = "k12-planner-canvas-toggle";
const STORAGE_OPEN = "canvasSidebarOpen";
const NAV_POLL_MS = 400;
const NAV_POLL_MAX = 75;

function isCanvasPage() {
  return /instructure\.com/i.test(location.hostname);
}

function findGlobalNavList() {
  const menu = document.querySelector("#menu");
  if (menu) {
    const list = menu.querySelector("ul") ?? menu;
    return list;
  }
  const nav =
    document.querySelector('nav[aria-label="Global Navigation"] ul') ??
    document.querySelector(".ic-app-header__main-navigation ul");
  return nav ?? null;
}

function injectToggle(onToggle) {
  if (document.getElementById(TOGGLE_ID)) return true;

  const list = findGlobalNavList();
  if (!list) return false;

  const li = document.createElement("li");
  li.id = TOGGLE_ID;
  li.className = "menu-item ic-app-header__menu-list-item";
  li.style.listStyle = "none";

  const btn = document.createElement("a");
  btn.href = "#";
  btn.className = "ic-app-header__menu-list-link";
  btn.setAttribute("aria-label", "K-12 Academic Command Center");
  btn.title = "K-12 Command Center";
  btn.style.cssText =
    "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-decoration:none;color:inherit;";

  const icon = document.createElement("span");
  icon.textContent = "📋";
  icon.style.fontSize = "18px";
  icon.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.textContent = "Planner";
  label.style.fontSize = "10px";
  label.style.fontWeight = "600";

  btn.appendChild(icon);
  btn.appendChild(label);

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  });

  li.appendChild(btn);
  list.appendChild(li);
  return true;
}

function ensureHost() {
  let host = document.getElementById(HOST_ID);
  if (host) return host;

  host = document.createElement("div");
  host.id = HOST_ID;
  host.dataset.k12Open = "false";
  host.style.cssText =
    "position:fixed;inset:0;z-index:2147483645;pointer-events:none;overflow:visible;";
  document.documentElement.appendChild(host);
  host.attachShadow({ mode: "open" });
  return host;
}

function loadSidebarModule() {
  if (window.__K12_CANVAS_SIDEBAR_LOADED__) return;
  window.__K12_CANVAS_SIDEBAR_LOADED__ = true;

  const script = document.createElement("script");
  script.type = "module";
  script.src = chrome.runtime.getURL("canvas/sidebar.js");
  script.onload = () => {
    const host = document.getElementById(HOST_ID);
    if (host?.k12SetOpen && host.dataset.k12PendingOpen === "true") {
      host.k12SetOpen(true);
      host.dataset.k12PendingOpen = "false";
    }
  };
  (document.head || document.documentElement).appendChild(script);
}

async function setOpen(open) {
  const host = ensureHost();
  host.dataset.k12Open = open ? "true" : "false";
  await chrome.storage.local.set({ [STORAGE_OPEN]: open }).catch(() => {});

  if (typeof host.k12SetOpen === "function") {
    host.k12SetOpen(open);
  } else {
    host.dataset.k12PendingOpen = open ? "true" : "false";
    loadSidebarModule();
  }
}

async function toggleSidebar() {
  const host = ensureHost();
  const next = host.dataset.k12Open !== "true";
  await setOpen(next);
  if (!window.__K12_CANVAS_SIDEBAR_LOADED__) {
    loadSidebarModule();
  }
}

function waitForNav() {
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (injectToggle(() => void toggleSidebar()) || attempts >= NAV_POLL_MAX) {
      clearInterval(timer);
      if (attempts >= NAV_POLL_MAX) {
        console.warn("[K12 Planner] Canvas global nav not found; toggle not injected.");
      }
    }
  }, NAV_POLL_MS);
}

async function init() {
  if (!isCanvasPage()) return;

  ensureHost();
  loadSidebarModule();

  try {
    const stored = await chrome.storage.local.get(STORAGE_OPEN);
    if (stored[STORAGE_OPEN]) {
      await setOpen(true);
    }
  } catch {
    /* ignore */
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForNav, { once: true });
  } else {
    waitForNav();
  }
}

init();

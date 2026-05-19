/**
 * Purpose: Parse Google Classroom assignment pages and offer save to K12 Planner.
 * Permissions: only classroom.google.com (see manifest).
 */

(function () {
  const BUTTON_ID = "k12-planner-save-btn";

  function parseAssignmentPage() {
    const titleEl =
      document.querySelector('[data-testid="assignment-title"]') ||
      document.querySelector("h1");
    const title = titleEl?.textContent?.trim();
    if (!title) return null;

    let dueText = "";
    const dueEl = document.querySelector('[class*="due"], [data-testid*="due"]');
    if (dueEl) dueText = dueEl.textContent ?? "";

  // TODO(future): improve due date parsing for all Classroom layouts
    return { title, dueText, sourceUrl: location.href };
  }

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;
    const data = parseAssignmentPage();
    if (!data) return;

    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.textContent = "Save to K12 Planner";
    btn.style.cssText =
      "position:fixed;bottom:16px;right:16px;z-index:9999;padding:10px 14px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2)";
    btn.addEventListener("click", () => {
      chrome.storage.session.set({
        pendingQuickAddTitle: data.title,
        pendingQuickAddSource: data.sourceUrl,
      });
      chrome.runtime.sendMessage({ type: "openPopup" });
    });
    document.body.appendChild(btn);
  }

  if (location.pathname.includes("/a/") || location.pathname.includes("/assignments/")) {
    injectButton();
  }
})();

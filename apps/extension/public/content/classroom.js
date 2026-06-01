/**
 * Google Classroom: Save assignment to K12 Planner with title, due date, and link.
 */

(function () {
  const BUTTON_ID = "k12-planner-save-btn";

  function parseDueFromText(text) {
    if (!text) return null;
    const cleaned = text
      .replace(/^due[:\s]*/i, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned) return null;

    const parsed = Date.parse(cleaned);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }

    const atMatch = cleaned.match(
      /(\w+)\s+(\d{1,2})(?:,?\s*(\d{4}))?(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?)?/i,
    );
    if (atMatch) {
      const months =
        "jan,feb,mar,apr,may,jun,jul,aug,sep,oct,nov,dec".split(",");
      const mi = months.indexOf(atMatch[1].slice(0, 3).toLowerCase());
      if (mi >= 0) {
        const year = atMatch[3] ? Number(atMatch[3]) : new Date().getFullYear();
        let hour = atMatch[4] ? Number(atMatch[4]) : 23;
        const minute = atMatch[5] ? Number(atMatch[5]) : 59;
        const ampm = atMatch[6];
        if (ampm) {
          const upper = ampm.toUpperCase();
          if (upper === "PM" && hour < 12) hour += 12;
          if (upper === "AM" && hour === 12) hour = 0;
        }
        const d = new Date(year, mi, Number(atMatch[2]), hour, minute);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
    }

    return null;
  }

  function parseAssignmentPage() {
    const titleEl =
      document.querySelector('[data-testid="assignment-title"]') ||
      document.querySelector("h1");
    const title = titleEl?.textContent?.trim();
    if (!title) return null;

    let dueText = "";
    const dueEl =
      document.querySelector('[data-testid*="due"]') ||
      document.querySelector('[class*="due"]');
    if (dueEl) dueText = dueEl.textContent ?? "";

    const dueAt = parseDueFromText(dueText);

    return { title, dueText, dueAt, sourceUrl: location.href };
  }

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;
    const data = parseAssignmentPage();
    if (!data) return;

    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.textContent = "Save to K12 Planner";
    btn.title = data.dueAt
      ? "Due date will be prefilled in the extension"
      : "Add due date in the extension if needed";
    btn.style.cssText =
      "position:fixed;bottom:16px;right:16px;z-index:9999;padding:10px 14px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2)";
    btn.addEventListener("click", () => {
      const payload = {
        pendingQuickAddTitle: data.title,
        pendingQuickAddSource: data.sourceUrl,
      };
      if (data.dueAt) payload.pendingQuickAddDue = data.dueAt;
      chrome.storage.session.set(payload);
      chrome.runtime.sendMessage({ type: "openPopup" });
    });
    document.body.appendChild(btn);
  }

  if (location.pathname.includes("/a/") || location.pathname.includes("/assignments/")) {
    injectButton();
  }
})();

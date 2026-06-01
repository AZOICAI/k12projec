import { useEffect, useState } from "react";
import { fullUrl } from "@k12/shared";
import { createAssignment, fetchCourses, fetchWorkSnapshot } from "../lib/api";
import { buildDefaultSettings } from "../lib/defaults";

const PENDING_TITLE_KEY = "pendingQuickAddTitle";
const PENDING_SOURCE_KEY = "pendingQuickAddSource";
const PENDING_DUE_KEY = "pendingQuickAddDue";

function formatDueShort(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const opts =
    d.getFullYear() !== now.getFullYear()
      ? { month: "short", day: "numeric", year: "numeric" }
      : { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
  return d.toLocaleString(undefined, opts);
}

function toDatetimeLocalValue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PopupApp() {
  const defaults = buildDefaultSettings();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [dueLocal, setDueLocal] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appUrl, setAppUrl] = useState(defaults.appUrl);
  const [work, setWork] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const { getSettings } = await import("../lib/storage");
        const { isConfigured } = await import("../lib/defaults");
        const settings = await getSettings();
        if (!isConfigured(settings)) {
          setMessage("Open extension Settings and sign in (same account as the website).");
          setLoading(false);
          return;
        }
        setAppUrl(settings.appUrl);

        const pending = await chrome.storage.session.get([
          PENDING_TITLE_KEY,
          PENDING_SOURCE_KEY,
          PENDING_DUE_KEY,
        ]);
        if (pending[PENDING_TITLE_KEY]) {
          setTitle(pending[PENDING_TITLE_KEY]);
          setShowQuickAdd(true);
        }
        if (pending[PENDING_DUE_KEY]) {
          setDueLocal(toDatetimeLocalValue(pending[PENDING_DUE_KEY]));
        }
        await chrome.storage.session.remove([
          PENDING_TITLE_KEY,
          PENDING_SOURCE_KEY,
          PENDING_DUE_KEY,
        ]);

        const [list, snapshot] = await Promise.all([fetchCourses(), fetchWorkSnapshot()]);
        setCourses(list);
        if (list.length) setCourseId(list[0].id);
        setWork(snapshot);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    if (!courseId) return;
    setSaving(true);
    setMessage(null);
    try {
      const pending = await chrome.storage.session.get([PENDING_SOURCE_KEY]);
      await createAssignment({
        course_id: courseId,
        title,
        due_at: new Date(dueLocal).toISOString(),
        source_url: pending[PENDING_SOURCE_KEY] ?? null,
      });
      await chrome.storage.session.remove([PENDING_SOURCE_KEY]);
      setTitle("");
      setDueLocal("");
      setShowQuickAdd(false);
      setMessage("Assignment added.");
      setWork(await fetchWorkSnapshot());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function openApp(path) {
    chrome.tabs.create({ url: fullUrl(appUrl, path) });
  }

  if (loading) {
    return <p className="muted">Loading…</p>;
  }

  const notConfigured = message && !courses.length && !work;

  return (
    <div className="wrap">
      <h1>K12 Planner</h1>

      {notConfigured ? <p className="error">{message}</p> : null}

      {work && work.preview.length > 0 ? (
        <section className="section-block">
          <div className="section-head">
            <h2 className="section-title">Need attention</h2>
            <span className="pill">{work.totalUrgent}</span>
          </div>
          <ul className="work-list">
            {work.preview.map((a) => (
              <li key={a.id} className="work-item">
                <span
                  className={`work-tag ${a.queueLabel === "Overdue" ? "work-tag-overdue" : ""}`}
                >
                  {a.queueLabel}
                </span>
                <span className="work-title">{a.title}</span>
                <span className="work-meta">
                  {a.courses?.name ?? "Class"} · {formatDueShort(a.due_at)}
                </span>
              </li>
            ))}
          </ul>
          {work.totalUrgent > work.preview.length ? (
            <p className="muted small">Open Courses for the full list.</p>
          ) : null}
        </section>
      ) : work && !notConfigured ? (
        <p className="muted small">Nothing overdue or due soon. Nice work.</p>
      ) : null}

      {!notConfigured && courses.length > 0 ? (
        <section className="section-block">
          <button
            type="button"
            className="link section-toggle"
            onClick={() => setShowQuickAdd((v) => !v)}
          >
            {showQuickAdd ? "− Hide quick add" : "+ Quick add assignment"}
          </button>
          {showQuickAdd ? (
            <form onSubmit={onSubmit} className="form">
              <label>
                Title
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <label>
                Course
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Due
                <input
                  type="datetime-local"
                  value={dueLocal}
                  onChange={(e) => setDueLocal(e.target.value)}
                  required
                />
              </label>
              {message ? (
                <p className={message.includes("added") ? "ok" : "error"}>{message}</p>
              ) : null}
              <button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Add assignment"}
              </button>
            </form>
          ) : null}
        </section>
      ) : !notConfigured ? (
        <p className="muted">Add a course on the website first.</p>
      ) : null}

      <div className="footer-links">
        <button type="button" className="link" onClick={() => openApp("/app")}>
          Open Today
        </button>
        <button type="button" className="link" onClick={() => openApp("/app/courses")}>
          Open Courses
        </button>
        <button type="button" className="link" onClick={() => openApp("/app/study")}>
          Focus timer
        </button>
        <button type="button" className="link" onClick={() => chrome.runtime.openOptionsPage()}>
          Settings
        </button>
      </div>
    </div>
  );
}

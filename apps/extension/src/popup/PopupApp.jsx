import { useEffect, useState } from "react";
import { createAssignment, fetchCourses } from "../lib/api";

const PENDING_TITLE_KEY = "pendingQuickAddTitle";
const PENDING_SOURCE_KEY = "pendingQuickAddSource";

export function PopupApp() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [dueLocal, setDueLocal] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appUrl, setAppUrl] = useState(import.meta.env.VITE_APP_URL ?? "");

  useEffect(() => {
    void (async () => {
      try {
        const { getSettings } = await import("../lib/storage");
        const settings = await getSettings();
        if (!settings?.appUrl) {
          setMessage("Open extension settings to configure and sign in.");
          setLoading(false);
          return;
        }
        setAppUrl(settings.appUrl);

        const pending = await chrome.storage.session.get([
          PENDING_TITLE_KEY,
          PENDING_SOURCE_KEY,
        ]);
        if (pending[PENDING_TITLE_KEY]) {
          setTitle(pending[PENDING_TITLE_KEY]);
          await chrome.storage.session.remove([PENDING_TITLE_KEY, PENDING_SOURCE_KEY]);
        }

        const list = await fetchCourses();
        setCourses(list);
        if (list.length) setCourseId(list[0].id);
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
      setMessage("Assignment added.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="muted">Loading…</p>;
  }

  return (
    <div className="wrap">
      <h1>Quick add</h1>
      {message && !courses.length ? <p className="error">{message}</p> : null}
      {courses.length === 0 && !message ? (
        <p className="muted">Add a course in the web app first.</p>
      ) : (
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
          {message ? <p className={message.includes("added") ? "ok" : "error"}>{message}</p> : null}
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Add assignment"}
          </button>
        </form>
      )}
      <div className="footer-links">
        <button type="button" className="link" onClick={() => chrome.tabs.create({ url: appUrl })}>
          Open planner
        </button>
        <button type="button" className="link" onClick={() => chrome.runtime.openOptionsPage()}>
          Settings
        </button>
      </div>
    </div>
  );
}

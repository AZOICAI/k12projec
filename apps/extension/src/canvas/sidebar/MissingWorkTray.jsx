function formatDue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MissingWorkTray({ items }) {
  if (!items?.length) {
    return (
      <section className="k12-section k12-section-danger">
        <h2 className="k12-section-title">Missing work tray</h2>
        <p className="k12-muted">Nothing overdue or due today. You&apos;re caught up.</p>
      </section>
    );
  }

  return (
    <section className="k12-section k12-section-danger">
      <h2 className="k12-section-title">Missing work tray</h2>
      <ul className="k12-missing-list">
        {items.map((a) => (
          <li
            key={a.id}
            className={`k12-missing-item ${a.urgency === "today" ? "k12-today" : ""}`}
          >
            <div className="k12-missing-title">{a.title}</div>
            <div className="k12-missing-meta">
              {a.courses?.name ?? "Class"} ·{" "}
              {a.urgency === "overdue" ? "Overdue" : "Due today"} · {formatDue(a.due_at)}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

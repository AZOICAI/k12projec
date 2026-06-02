export function GamificationRing({ percent, done, total }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  const stroke = percent >= 80 ? "#22c55e" : percent >= 50 ? "#3b82f6" : "#f59e0b";

  return (
    <section className="k12-section">
      <h2 className="k12-section-title">Weekly completion</h2>
      <div className="k12-ring-wrap">
        <svg className="k12-ring-svg" viewBox="0 0 88 88" aria-hidden>
          <circle cx="44" cy="44" r={r} fill="none" stroke="#2a2f3d" strokeWidth="8" />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform="rotate(-90 44 44)"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
          <text x="44" y="42" textAnchor="middle" className="k12-ring-label">
            {percent}%
          </text>
          <text x="44" y="54" textAnchor="middle" className="k12-ring-sub">
            this week
          </text>
        </svg>
        <div className="k12-ring-stats">
          <strong>
            {done} / {total}
          </strong>{" "}
          assignments done
          <br />
          Due dates Mon–Sun (same as Today tab).
        </div>
      </div>
    </section>
  );
}

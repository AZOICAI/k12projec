import { useEffect, useMemo, useState } from "react";

function computeHypothetical(currentPct, earned, possible) {
  const e = Number(earned);
  const p = Number(possible);
  if (!Number.isFinite(e) || !Number.isFinite(p) || p <= 0) return null;

  const assignmentPct = (e / p) * 100;
  const cur = Number(currentPct);
  if (Number.isFinite(cur) && cur >= 0) {
    const projected = (cur + assignmentPct) / (1 + p / 100);
    return Math.round(projected * 10) / 10;
  }
  return Math.round(assignmentPct * 10) / 10;
}

export function WhatIfCalculator({ courses }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [currentPct, setCurrentPct] = useState("");
  const [earned, setEarned] = useState("");
  const [possible, setPossible] = useState("");

  const course = courses.find((c) => c.id === courseId);

  useEffect(() => {
    if (course?.current_grade_percent != null) {
      setCurrentPct(String(course.current_grade_percent));
    }
  }, [course?.id, course?.current_grade_percent]);

  const projected = useMemo(() => {
    return computeHypothetical(currentPct, earned, possible);
  }, [currentPct, earned, possible]);

  return (
    <section className="k12-section">
      <h2 className="k12-section-title">What-if mini-calculator</h2>
      <p className="k12-muted" style={{ margin: "0 0 10px" }}>
        Estimate class % if you score X/Y on one more assignment.
      </p>
      <div className="k12-form">
        {courses.length > 0 ? (
          <label>
            Class
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          Current class % (optional)
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={currentPct}
            onChange={(e) => setCurrentPct(e.target.value)}
            placeholder={course?.current_grade_percent ?? "e.g. 82"}
          />
        </label>
        <label>
          Points you might earn
          <input
            type="number"
            min={0}
            value={earned}
            onChange={(e) => setEarned(e.target.value)}
            placeholder="e.g. 18"
          />
        </label>
        <label>
          Points possible
          <input
            type="number"
            min={1}
            value={possible}
            onChange={(e) => setPossible(e.target.value)}
            placeholder="e.g. 20"
          />
        </label>
      </div>
      {projected != null ? (
        <div className="k12-result">
          Projected class grade: <strong>{projected}%</strong>
          {course?.target_grade_percent != null ? (
            <span>
              {" "}
              (goal {course.target_grade_percent}%)
            </span>
          ) : null}
        </div>
      ) : (
        <p className="k12-muted">Enter points earned and possible to calculate.</p>
      )}
    </section>
  );
}

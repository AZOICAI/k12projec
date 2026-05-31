/**
 * Purpose: Build unified calendar events for a week (assignments, study blocks).
 */

import { isSameLocalDate, toLocalDateInputValue } from "@k12/shared";

export function buildWeekCalendarData(assignments, studyBlocks, weekStart) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return days.map((day) => {
    const dayKey = toLocalDateInputValue(day);
    const dayAssignments = assignments.filter((a) => isSameLocalDate(a.due_at, dayKey));
    const dayStudy = studyBlocks.filter((b) => isSameLocalDate(b.starts_at, dayKey));

    const assignmentEvents = dayAssignments
      .sort((x, y) => new Date(x.due_at).getTime() - new Date(y.due_at).getTime())
      .map((a) => ({
        type: "assignment",
        id: a.id,
        title: a.title,
        color: a.courses?.color ?? "#3B82F6",
        sortAt: new Date(a.due_at).getTime(),
        time: new Date(a.due_at).toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        }),
      }));

    const study = dayStudy
      .sort((x, y) => new Date(x.starts_at).getTime() - new Date(y.starts_at).getTime())
      .map((b) => ({
        type: "study",
        id: b.id,
        title: b.title,
        color: "#8B5CF6",
        sortAt: new Date(b.starts_at).getTime(),
        time: `${new Date(b.starts_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} – ${new Date(b.ends_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`,
      }));

    return {
      day,
      key: day.toDateString(),
      assignments: assignmentEvents,
      study,
    };
  });
}

/** Chronological agenda for the week (study → due). */
export function buildWeekAgenda(weekDays) {
  const items = [];
  for (const { day, study, assignments } of weekDays) {
    const dayLabel = day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    for (const ev of study) {
      items.push({ ...ev, dayLabel, dayKey: day.toDateString(), kind: "Study" });
    }
    for (const ev of assignments) {
      items.push({ ...ev, dayLabel, dayKey: day.toDateString(), kind: "Due" });
    }
  }
  return items.sort((a, b) => {
    if (a.dayKey !== b.dayKey) return new Date(a.dayKey).getTime() - new Date(b.dayKey).getTime();
    return (a.sortAt ?? 0) - (b.sortAt ?? 0);
  });
}

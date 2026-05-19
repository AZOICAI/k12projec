/**
 * Purpose: Build unified calendar events for a week (assignments, classes, study).
 */

export function meetingsForDay(courseMeetings, dayDate) {
  const weekday = dayDate.getDay();
  return (courseMeetings ?? []).filter((m) => m.weekday === weekday);
}

export function formatMinutes(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ap}`;
}

export function buildWeekCalendarData(assignments, studyBlocks, courses, weekStart) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const allMeetings = courses.flatMap((c) =>
    (c.course_meetings ?? []).map((m) => ({ ...m, course: c })),
  );

  return days.map((day) => {
    const key = day.toDateString();
    const dayAssignments = assignments.filter((a) => {
      const due = new Date(a.due_at);
      return due.toDateString() === key;
    });
    const dayStudy = studyBlocks.filter((b) => {
      const start = new Date(b.starts_at);
      return start.toDateString() === key;
    });
    const dayMeetings = meetingsForDay(allMeetings, day).map((m) => ({
      type: "meeting",
      id: m.id,
      title: m.course?.name ?? "Class",
      color: m.course?.color ?? "#3B82F6",
      time: `${formatMinutes(m.start_minutes)} – ${formatMinutes(m.end_minutes)}`,
    }));

    return {
      day,
      key,
      assignments: dayAssignments.map((a) => ({
        type: "assignment",
        id: a.id,
        title: a.title,
        color: a.courses?.color ?? "#3B82F6",
        time: new Date(a.due_at).toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        }),
      })),
      study: dayStudy.map((b) => ({
        type: "study",
        id: b.id,
        title: b.title,
        color: "#8B5CF6",
        time: `${new Date(b.starts_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} – ${new Date(b.ends_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`,
      })),
      meetings: dayMeetings,
    };
  });
}

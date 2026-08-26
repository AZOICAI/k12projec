export const progressTiers = [
  { id: "bronze", name: "Bronze", minPoints: 0, maxPoints: 299, color: "#b97746", glow: "from-amber-700/30 to-amber-500/10" },
  { id: "silver", name: "Silver", minPoints: 300, maxPoints: 699, color: "#c0c7d1", glow: "from-slate-400/30 to-slate-200/10" },
  { id: "gold", name: "Gold", minPoints: 700, maxPoints: 1299, color: "#f4c95d", glow: "from-yellow-400/30 to-yellow-200/10" },
  { id: "platinum", name: "Platinum", minPoints: 1300, maxPoints: 2199, color: "#8fe3d5", glow: "from-emerald-400/30 to-cyan-200/10" },
  { id: "legend", name: "Legend", minPoints: 2200, maxPoints: Infinity, color: "#8b5cf6", glow: "from-violet-500/30 to-fuchsia-200/10" },
];

const RECENT_ACTIVITY_MS = 1000 * 60 * 60 * 24 * 365 * 2;

export function isRecentActivity(dateValue) {
  if (!dateValue) return true;

  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) return true;

  return Date.now() - timestamp <= RECENT_ACTIVITY_MS;
}

export function isActiveAssignment(assignment) {
  if (!assignment) return false;
  if (assignment.status === "done") return false;
  if (!assignment.due_at) return false;
  if (!isRecentActivity(assignment.due_at)) return false;
  return true;
}

export function filterRecentAssignments(assignments = []) {
  return assignments.filter((assignment) => isActiveAssignment(assignment));
}

export function filterRecentCourses(courses = []) {
  return courses.filter((course) => {
    if (!course?.created_at) return true;
    return isRecentActivity(course.created_at);
  });
}

export const datxGraduationRequirements = [
  { label: "English", required: 4, completed: 3, note: "English I, II, III, IV" },
  { label: "Math", required: 3, completed: 2, note: "Algebra I, Geometry, plus 1 additional credit" },
  { label: "Science", required: 3, completed: 2, note: "Biology + Chemistry or IPC + 1 additional science" },
  { label: "Social Studies", required: 4, completed: 3, note: "World Geography/History, US History, Gov/Econ" },
  { label: "Language Other Than English", required: 2, completed: 1, note: "Same language two levels" },
  { label: "Physical Education", required: 1, completed: 1, note: "PE Foundations" },
  { label: "Fine Arts", required: 1, completed: 1, note: "Art or Music" },
  { label: "CTE", required: 2, completed: 0, note: "Career and technical education" },
  { label: "State Electives", required: 3, completed: 2, note: "Academic electives" },
  { label: "Local Electives", required: 3, completed: 2, note: "Additional local credits" },
];

export function getCompletedCourseCredits(completedCourses = []) {
  return completedCourses.reduce((total, course) => total + Number(course.credits || 0), 0);
}

export function getStudyHours(studyBlocks = []) {
  return studyBlocks.reduce((total, block) => {
    if (!isRecentActivity(block.starts_at)) return total;

    const startsAt = new Date(block.starts_at).getTime();
    const endsAt = new Date(block.ends_at).getTime();
    const durationHours = (endsAt - startsAt) / (1000 * 60 * 60);
    return total + Math.max(0, durationHours);
  }, 0);
}

export function getCompletedAssignments(assignments = []) {
  return assignments.filter((assignment) => assignment.status === "done" && isRecentActivity(assignment.due_at)).length;
}

export function getCurrentStreak(assignments = []) {
  const doneDateSet = new Set(
    assignments
      .filter((assignment) => assignment.status === "done" && isRecentActivity(assignment.due_at))
      .map((assignment) => new Date(assignment.due_at).toISOString().slice(0, 10)),
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (doneDateSet.has(iso)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    break;
  }

  return streak;
}

export function getDatxGraduationProgress() {
  const totalRequired = datxGraduationRequirements.reduce((sum, category) => sum + category.required, 0);
  const totalCompleted = datxGraduationRequirements.reduce((sum, category) => sum + Math.min(category.required, category.completed), 0);
  const totalRemaining = Math.max(0, totalRequired - totalCompleted);

  return {
    totalRequired,
    totalCompleted,
    totalRemaining,
    percent: Math.min(100, (totalCompleted / totalRequired) * 100),
    requirements: datxGraduationRequirements,
  };
}

export function getProgressSummary({ assignments = [], studyBlocks = [], streakDays = 0, earnedCredits = 0 }) {
  const completedAssignments = getCompletedAssignments(assignments);
  const studyHours = getStudyHours(studyBlocks);
  const points = completedAssignments * 18 + studyHours * 2 + streakDays * 12 + earnedCredits * 6;

  let currentTier = progressTiers[0];
  let nextTier = null;

  for (let index = 0; index < progressTiers.length; index += 1) {
    const tier = progressTiers[index];
    if (points >= tier.minPoints) {
      currentTier = tier;
    }
    if (points < tier.minPoints && index > 0) {
      nextTier = progressTiers[index];
      break;
    }
  }

  if (!nextTier && currentTier.id === "legend") {
    nextTier = currentTier;
  }

  const currentTierStart = currentTier.minPoints;
  const currentTierEnd = currentTier.maxPoints === Infinity ? points + 1 : currentTier.maxPoints;
  const range = Math.max(1, currentTierEnd - currentTierStart);
  const currentTierProgress = Math.min(100, ((points - currentTierStart) / range) * 100);

  return {
    points,
    completedAssignments,
    studyHours,
    streakDays,
    currentTier,
    nextTier,
    currentTierProgress,
    earnedCredits,
  };
}

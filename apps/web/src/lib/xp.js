import { apiPaths } from "@k12/shared";

export const rankLevels = [
  { name: "Bronze I", short: "B1", minXp: 0, maxXp: 99, color: "#b97746", icon: "🥉" },
  { name: "Bronze II", short: "B2", minXp: 100, maxXp: 249, color: "#d09a5d", icon: "🥉" },
  { name: "Bronze III", short: "B3", minXp: 250, maxXp: 499, color: "#e2b55d", icon: "🥉" },
  { name: "Silver I", short: "S1", minXp: 500, maxXp: 999, color: "#c0c7d1", icon: "🥈" },
  { name: "Silver II", short: "S2", minXp: 1000, maxXp: 1499, color: "#dfe7ee", icon: "🥈" },
  { name: "Silver III", short: "S3", minXp: 1500, maxXp: 2299, color: "#e4eeff", icon: "🥈" },
  { name: "Gold I", short: "G1", minXp: 2300, maxXp: 3299, color: "#f4c95d", icon: "🥇" },
  { name: "Gold II", short: "G2", minXp: 3300, maxXp: 4999, color: "#f7d972", icon: "🥇" },
  { name: "Gold III", short: "G3", minXp: 5000, maxXp: 6999, color: "#f0d558", icon: "🥇" },
  { name: "Platinum", short: "PL", minXp: 7000, maxXp: 9999, color: "#8fe3d5", icon: "🏆" },
  { name: "Legend", short: "LG", minXp: 10000, maxXp: Infinity, color: "#8b5cf6", icon: "👑" },
];

const LAST_RANK_KEY = "k12-last-rank";

export function getCurrentRank(totalXp) {
  return [...rankLevels].reverse().find((rank) => totalXp >= rank.minXp) ?? rankLevels[0];
}

export function getNextRank(totalXp) {
  return rankLevels.find((rank) => totalXp < rank.minXp) ?? null;
}

export function getRankProgress(totalXp) {
  const current = getCurrentRank(totalXp);
  const next = getNextRank(totalXp);
  const range = Math.max(1, current.maxXp - current.minXp);
  const progress = Math.min(100, Math.max(0, ((totalXp - current.minXp) / range) * 100));
  const xpToNext = next ? Math.max(0, next.minXp - totalXp) : 0;
  return { current, next, progress, xpToNext };
}

export function getStudyMinutes(studyBlocks = []) {
  return studyBlocks.reduce((total, block) => {
    if (!block.is_complete) return total;
    const s = new Date(block.starts_at).getTime();
    const e = new Date(block.ends_at).getTime();
    return total + Math.max(0, (e - s) / (1000 * 60));
  }, 0);
}

export function getAssignmentXP(assignments = []) {
  return assignments.filter((a) => a.status === "done").length * 25;
}

export function getTotalXp(assignments = [], studyBlocks = []) {
  return Math.round(getStudyMinutes(studyBlocks) + getAssignmentXP(assignments));
}

export async function fetchXpData() {
  const [assignments, studyBlocks] = await Promise.all([
    fetch(apiPaths.assignments, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    fetch(`${apiPaths.studyBlocks}?${new URLSearchParams({
      from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 2).toISOString(),
      to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    })}`, { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
  ]);
  return [assignments, studyBlocks];
}

export function getStoredRankName() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(LAST_RANK_KEY); } catch { return null; }
}

export function storeRankName(name) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LAST_RANK_KEY, name); } catch {}
}

export async function checkRankUp() {
  try {
    const [assignments, studyBlocks] = await fetchXpData();
    const totalXp = getTotalXp(assignments, studyBlocks);
    const current = getCurrentRank(totalXp);
    const stored = getStoredRankName();
    if (stored && stored !== current.name) {
      storeRankName(current.name);
      return current;
    }
    storeRankName(current.name);
    return null;
  } catch {
    return null;
  }
}

export async function updateStoredRank() {
  try {
    const [assignments, studyBlocks] = await fetchXpData();
    const totalXp = getTotalXp(assignments, studyBlocks);
    const current = getCurrentRank(totalXp);
    storeRankName(current.name);
  } catch {}
}
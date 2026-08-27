import Link from "next/link";
import { apiPaths } from "@k12/shared";
import { serverApi } from "@/lib/server-api";
import RankUpDetector from "@/components/RankUpDetector";

const rankLevels = [
  { name: "Bronze I", short: "B1", minXp: 0, maxXp: 99, color: "#b97746", accent: "from-amber-500/30 to-orange-500/10", icon: "🥉" },
  { name: "Bronze II", short: "B2", minXp: 100, maxXp: 249, color: "#d09a5d", accent: "from-amber-400/30 to-yellow-500/10", icon: "🥉" },
  { name: "Bronze III", short: "B3", minXp: 250, maxXp: 499, color: "#e2b55d", accent: "from-yellow-500/30 to-amber-500/10", icon: "🥉" },
  { name: "Silver I", short: "S1", minXp: 500, maxXp: 999, color: "#c0c7d1", accent: "from-slate-300/30 to-slate-500/10", icon: "🥈" },
  { name: "Silver II", short: "S2", minXp: 1000, maxXp: 1499, color: "#dfe7ee", accent: "from-slate-200/30 to-blue-400/10", icon: "🥈" },
  { name: "Silver III", short: "S3", minXp: 1500, maxXp: 2299, color: "#e4eeff", accent: "from-cyan-400/30 to-sky-400/10", icon: "🥈" },
  { name: "Gold I", short: "G1", minXp: 2300, maxXp: 3299, color: "#f4c95d", accent: "from-yellow-300/30 to-amber-400/10", icon: "🥇" },
  { name: "Gold II", short: "G2", minXp: 3300, maxXp: 4999, color: "#f7d972", accent: "from-yellow-400/30 to-orange-500/10", icon: "🥇" },
  { name: "Gold III", short: "G3", minXp: 5000, maxXp: 6999, color: "#f0d558", accent: "from-yellow-300/40 to-orange-400/10", icon: "🥇" },
  { name: "Platinum", short: "PL", minXp: 7000, maxXp: 9999, color: "#8fe3d5", accent: "from-emerald-400/30 to-cyan-300/10", icon: "🏆" },
  { name: "Legend", short: "LG", minXp: 10000, maxXp: Infinity, color: "#8b5cf6", accent: "from-violet-500/30 to-fuchsia-500/10", icon: "👑" },
];

const badgeList = [
  { name: "Study Starter", minXp: 60, icon: "⏱️", text: "1 hour of study" },
  { name: "Assignment Ace", minXp: 125, icon: "✅", text: "5 assignments completed" },
  { name: "Focus Builder", minXp: 300, icon: "🔥", text: "500 minutes studied" },
  { name: "Silver Rank", minXp: 500, icon: "🥈", text: "Reach Silver" },
  { name: "Consistent Scholar", minXp: 1200, icon: "📚", text: "2k XP total" },
  { name: "Legend Path", minXp: 7000, icon: "👑", text: "Reach Legend" },
];

function getStudyMinutes(studyBlocks = []) {
  return studyBlocks.reduce((total, block) => {
    if (!block.is_complete) return total;
    const startsAt = new Date(block.starts_at).getTime();
    const endsAt = new Date(block.ends_at).getTime();
    return total + Math.max(0, (endsAt - startsAt) / (1000 * 60));
  }, 0);
}

function getAssignmentXP(assignments = []) {
  return assignments.filter((assignment) => assignment.status === "done").length * 25;
}

function clampPercent(value) {
  return Math.min(100, Math.max(0, value));
}

export default async function DashboardPage() {
  let assignments = [];
  let studyBlocks = [];
  let loadError = null;

  try {
    const [a, s] = await Promise.all([
      serverApi(apiPaths.assignments),
      serverApi(apiPaths.studyBlocks),
    ]);
    assignments = a ?? [];
    studyBlocks = s ?? [];
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load progress data.";
  }

  const studyMinutes = getStudyMinutes(studyBlocks);
  const assignmentXp = getAssignmentXP(assignments);
  const totalXp = Math.round(studyMinutes + assignmentXp);

  const currentRank = [...rankLevels].reverse().find((rank) => totalXp >= rank.minXp) ?? rankLevels[0];
  const nextRank = rankLevels.find((rank) => totalXp < rank.minXp) ?? null;
  const currentRange = Math.max(1, currentRank.maxXp - currentRank.minXp);
  const progressInCurrentRank = clampPercent(((totalXp - currentRank.minXp) / currentRange) * 100);
  const xpToNextRank = nextRank ? Math.max(0, nextRank.minXp - totalXp) : 0;
  const nextRankLabel = nextRank ? nextRank.name : "Max rank reached";

  const completedAssignments = assignments.filter((assignment) => assignment.status === "done").length;
  const activeStudyHours = (studyMinutes / 60).toFixed(1);

  return (
    <div className="flex flex-col gap-6 text-zinc-50">
      <RankUpDetector />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Progress hub</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Your XP journey</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Every assignment and every minute of study turns into momentum.
          </p>
        </div>

        <Link
          href="/app/assignments"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110"
        >
          + Quick add
        </Link>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{loadError}</p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.7fr_0.9fr]">
        <div className="overflow-hidden rounded-3xl border border-violet-400/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-violet-950/60 p-6 shadow-[0_18px_60px_rgba(124,58,237,0.20)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-400">Current rank</div>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 text-3xl shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${currentRank.color}66, rgba(255,255,255,0.08))` }}
                >
                  {currentRank.icon}
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight">{currentRank.name}</div>
                  <div className="text-sm text-zinc-300">Level {Math.max(1, rankLevels.findIndex((rank) => rank.name === currentRank.name) + 1)}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">XP</div>
              <div className="mt-1 text-3xl font-black text-white">{totalXp}</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-300">
              <span>Progress to {nextRank ? nextRank.name : currentRank.name}</span>
              <span>{nextRank ? `${xpToNextRank} XP left` : "Completed"}</span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${nextRank ? clampPercent(progressInCurrentRank) : 100}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
              <span>{totalXp} XP</span>
              <span>{nextRank ? `${xpToNextRank} XP needed` : "Maxed out!"}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-violet-200">Assignments</div>
              <div className="mt-3 text-3xl font-black">{completedAssignments}</div>
              <div className="mt-1 text-xs text-zinc-300">{completedAssignments * 25} XP earned</div>
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-blue-200">Study</div>
              <div className="mt-3 text-3xl font-black">{activeStudyHours}h</div>
              <div className="mt-1 text-xs text-zinc-300">{studyMinutes} XP earned</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-200">Next rank</div>
              <div className="mt-3 text-xl font-black">{nextRankLabel}</div>
              <div className="mt-1 text-xs text-zinc-300">{nextRank ? `${xpToNextRank} XP to go` : "You finished the ladder"}</div>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.6)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Badges</h2>
            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-violet-200">
              {badgeList.filter((badge) => totalXp >= badge.minXp).length}/{badgeList.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {badgeList.map((badge) => {
              const unlocked = totalXp >= badge.minXp;
              return (
                <div
                  key={badge.name}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition ${unlocked ? "border-emerald-500/30 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900/60 opacity-65"}`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${unlocked ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
                    {badge.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{badge.name}</div>
                    <div className="text-[11px] text-zinc-400">{badge.text}</div>
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{unlocked ? "Unlocked" : `${badge.minXp}xp`}</div>
                </div>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Ranking system</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">Levels</span>
          </div>

          <div className="mt-5 space-y-3">
            {rankLevels.map((rank) => {
              const unlocked = totalXp >= rank.minXp;
              const active = currentRank.name === rank.name;
              const nextThreshold = rank.maxXp === Infinity ? "∞" : `${rank.maxXp} XP`;

              return (
                <div
                  key={rank.name}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                    active ? "border-violet-500/40 bg-violet-500/10" : unlocked ? "border-emerald-500/25 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900/60"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${rank.color}22`, color: rank.color }}>
                    {rank.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{rank.name}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{rank.short}</span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">{rank.minXp}–{nextThreshold}</div>
                  </div>
                  <div className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-300">
                    {unlocked ? "Owned" : "Locked"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5">
          <h2 className="text-xl font-bold">XP rules</h2>
          <div className="mt-5 space-y-4 text-sm text-zinc-300">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="font-semibold text-white">Assignments</div>
              <div className="mt-1">Complete a task = +25 XP</div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="font-semibold text-white">Study time</div>
              <div className="mt-1">1 minute = 1 XP</div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="font-semibold text-white">Example</div>
              <div className="mt-1">30 minutes studying = 30 XP</div>
              <div className="mt-1">1 hour studying = 60 XP</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

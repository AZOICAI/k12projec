import { apiPaths } from "@k12/shared";
import { serverApi } from "@/lib/server-api";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { QuickAddDrawer } from "@/components/dashboard/QuickAddDrawer";
import { NotificationRunner } from "@/components/dashboard/NotificationRunner";

export default async function DashboardPage() {
  let summary = null;
  let loadError = null;

  try {
    summary = await serverApi(apiPaths.dashboardSummary);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load dashboard.";
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Your week at a glance — deadlines, progress, and study time.
          </p>
        </div>
        <QuickAddDrawer />
      </div>

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {loadError}
        </p>
      ) : summary ? (
        <>
          <OnboardingBanner
            courseCount={summary.course_count ?? 0}
            assignmentCount={summary.total_assignment_count ?? 0}
          />
          <DashboardClient initialSummary={summary} />
          <NotificationRunner />
        </>
      ) : null}
    </div>
  );
}

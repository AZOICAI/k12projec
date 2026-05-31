import { loadDashboardSummary } from "@/lib/dashboard/loadSummary";
import { TodayView } from "@/components/dashboard/TodayView";
import { NotificationRunner } from "@/components/dashboard/NotificationRunner";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function DashboardPage() {
  let data = null;
  let loadError = null;

  try {
    data = await loadDashboardSummary();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load dashboard.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Today" description="Your week at a glance — open Courses for each class, GPA, and redos." />

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {loadError}
        </p>
      ) : data ? (
        <>
          <TodayView data={data} />
          <NotificationRunner />
        </>
      ) : (
        <p className="text-sm text-zinc-500">Sign in to see your week.</p>
      )}
    </div>
  );
}

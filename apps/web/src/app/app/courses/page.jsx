import { loadCoursesPage } from "@/lib/dashboard/loadSummary";
import { getCanvasConnection } from "@/lib/canvas/connection";
import { CoursesClient } from "@/components/courses/CoursesClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";

const VALID_FILTERS = new Set(["all", "overdue", "due_today", "soon", "needs_redo"]);

export default async function CoursesPage({ searchParams }) {
  const sp = await searchParams;
  const initialFilter = VALID_FILTERS.has(sp?.filter) ? sp.filter : "all";

  let data = null;
  let loadError = null;
  let canvasConnected = false;
  let lastSyncedAt = null;

  try {
    data = await loadCoursesPage();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const connection = await getCanvasConnection(user.id);
      canvasConnected = Boolean(connection);
      lastSyncedAt = connection?.last_synced_at ?? null;
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load courses.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Courses"
        description="GPA, overdue, due today, soon, and low-score redos for each class."
      />

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {loadError}
        </p>
      ) : data ? (
        <CoursesClient
          data={data}
          canvasConnected={canvasConnected}
          lastSyncedAt={lastSyncedAt}
          initialFilter={initialFilter}
        />
      ) : (
        <p className="text-sm text-zinc-500">Sign in to see your classes.</p>
      )}
    </div>
  );
}

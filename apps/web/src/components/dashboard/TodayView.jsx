"use client";

import { useRouter } from "next/navigation";
import { useUndoStack } from "@/hooks/useUndoStack";
import { DashboardClient } from "./DashboardClient";
import { QuickAddDrawer } from "./QuickAddDrawer";

export function TodayView({ data }) {
  const router = useRouter();
  const { pushUndo } = useUndoStack(() => router.refresh());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <QuickAddDrawer pushUndo={pushUndo} />
      </div>
      <DashboardClient initialSummary={data} pushUndo={pushUndo} />
    </div>
  );
}

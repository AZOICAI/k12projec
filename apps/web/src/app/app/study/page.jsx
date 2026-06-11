"use client";

import { apiPaths } from "@k12/shared";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { FocusPanel } from "@/components/study/FocusPanel";
import { PageHeader } from "@/components/ui/PageHeader";

function FocusPageInner() {
  const searchParams = useSearchParams();
  const initialAssignmentId = searchParams.get("assignment");
  const [blocks, setBlocks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const sorted = useMemo(
    () => [...blocks].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [blocks],
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    const from = new Date();
    from.setDate(from.getDate() - 60);
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setDate(to.getDate() + 180);
    to.setHours(23, 59, 59, 999);

    const blockFrom = new Date();
    blockFrom.setHours(0, 0, 0, 0);
    const blockTo = new Date(blockFrom);
    blockTo.setDate(blockTo.getDate() + 21);
    blockTo.setHours(23, 59, 59, 999);

    const assignQ = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    const blockQ = new URLSearchParams({
      from: blockFrom.toISOString(),
      to: blockTo.toISOString(),
    });

    const [assignRes, blockRes] = await Promise.all([
      fetch(`${apiPaths.assignments}?${assignQ}`, { credentials: "include" }),
      fetch(`${apiPaths.studyBlocks}?${blockQ}`, { credentials: "include" }),
    ]);

    if (!assignRes.ok || !blockRes.ok) {
      setError("Failed to load focus workspace.");
      setLoading(false);
      return;
    }

    setAssignments(await assignRes.json());
    setBlocks(await blockRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Focus"
        description="Study timer plus an AI tutor for the assignment you're working on."
      />

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <FocusPanel
          blocks={sorted}
          assignments={assignments}
          error={error}
          initialAssignmentId={initialAssignmentId}
        />
      )}
    </div>
  );
}

export default function FocusPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
      <FocusPageInner />
    </Suspense>
  );
}

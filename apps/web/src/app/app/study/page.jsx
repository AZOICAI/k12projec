"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useMemo, useState } from "react";
import { FocusPanel } from "@/components/study/FocusPanel";
import { PageHeader } from "@/components/ui/PageHeader";

export default function FocusPage() {
  const [blocks, setBlocks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const sorted = useMemo(
    () => [...blocks].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [blocks],
  );

  async function load() {
    setError(null);
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 21);
    to.setHours(23, 59, 59, 999);
    const q = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    const res = await fetch(`${apiPaths.studyBlocks}?${q}`, { credentials: "include" });
    if (!res.ok) {
      setError(await res.text());
      setLoading(false);
      return;
    }
    setBlocks(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Focus" description="Timer and your next scheduled block." />
      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <FocusPanel blocks={sorted} error={error} />
      )}
    </div>
  );
}

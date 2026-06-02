"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { StudyTimer } from "@/components/study/StudyTimer";
import { TutorChat } from "@/components/study/TutorChat";

export function FocusPanel({ blocks, assignments, error }) {
  const router = useRouter();
  const nextBlock = useMemo(() => {
    const now = Date.now();
    return blocks.find((b) => new Date(b.ends_at).getTime() > now) ?? blocks[0];
  }, [blocks]);

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <StudyTimer onSessionLogged={() => router.refresh()} />
          {nextBlock ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-medium uppercase text-zinc-500">Up next</p>
              <p className="mt-1 font-medium">{nextBlock.title}</p>
              <p className="text-sm text-zinc-500">
                {new Date(nextBlock.starts_at).toLocaleString()} –{" "}
                {new Date(nextBlock.ends_at).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Nothing scheduled yet.{" "}
              <Link href="/app/schedule" className="font-medium text-blue-600 hover:underline">
                Plan your day on Schedule →
              </Link>
            </p>
          )}
        </div>

        <TutorChat assignments={assignments} />
      </div>

      <p className="text-sm text-zinc-500">
        <Link href="/app/schedule" className="text-blue-600 hover:underline">
          Edit schedule
        </Link>
        {" · "}
        <Link href="/app/courses" className="text-blue-600 hover:underline">
          Courses & Canvas sync
        </Link>
      </p>
    </div>
  );
}

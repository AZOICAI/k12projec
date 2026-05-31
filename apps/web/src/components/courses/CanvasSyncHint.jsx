import Link from "next/link";

export function CanvasSyncHint({ connected, lastSyncedAt }) {
  if (!connected) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
        Connect Canvas in{" "}
        <Link href="/app/settings" className="font-medium text-blue-600 hover:underline">
          Settings
        </Link>{" "}
        to import assignment scores and class percentages.
      </p>
    );
  }

  return (
    <p className="text-xs text-zinc-500">
      {lastSyncedAt ? (
        <>
          Canvas last imported{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {new Date(lastSyncedAt).toLocaleString()}
          </span>
          . Grades update when you run Import again in{" "}
        </>
      ) : (
        <>Run Import in </>
      )}
      <Link href="/app/settings" className="font-medium text-blue-600 hover:underline">
        Settings
      </Link>
      .
    </p>
  );
}

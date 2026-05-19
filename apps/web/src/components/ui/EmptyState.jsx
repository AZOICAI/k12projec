/**
 * Purpose: Friendly empty lists and first-run hints.
 */

import Link from "next/link";
import { Button } from "./Button";

export function EmptyState({ title, description, actionHref, actionLabel }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400">
      <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
      {description ? <p className="max-w-sm">{description}</p> : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref}>
          <Button variant="primary" size="sm">
            {actionLabel}
          </Button>
        </Link>
      ) : null}
    </div>
  );
}

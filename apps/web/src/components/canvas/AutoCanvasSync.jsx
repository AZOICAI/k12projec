"use client";

import { apiPaths } from "@k12/shared";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const CHECK_KEY = "k12.autoSync.lastCheck";
const CHECK_EVERY_MS = 10 * 60 * 1000;
const STALE_AFTER_MS = 15 * 60 * 1000;

/**
 * Keeps Canvas data fresh without the student doing anything: on app load,
 * if the last sync is older than 15 minutes, kick off a background sync and
 * refresh the page data when it finishes.
 */
export function AutoCanvasSync() {
  const router = useRouter();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const lastCheck = Number(sessionStorage.getItem(CHECK_KEY) ?? 0);
    if (Date.now() - lastCheck < CHECK_EVERY_MS) return;
    sessionStorage.setItem(CHECK_KEY, String(Date.now()));

    let cancelled = false;

    async function run() {
      try {
        const statusRes = await fetch(apiPaths.canvasStatus, { credentials: "include" });
        if (!statusRes.ok) return;
        const status = await statusRes.json();
        if (!status.connected || !status.available) return;

        const lastSynced = status.lastSyncedAt ? new Date(status.lastSyncedAt).getTime() : 0;
        if (Date.now() - lastSynced < STALE_AFTER_MS) return;

        const syncRes = await fetch(apiPaths.canvasSync, {
          method: "POST",
          credentials: "include",
        });
        if (!cancelled && syncRes.ok) {
          router.refresh();
        }
      } catch {
        /* background sync is best-effort */
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}

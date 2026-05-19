"use client";

/**
 * Purpose: Browser notifications for upcoming assignment due dates (tab open).
 * Limitation: reminders only fire while a planner tab is open.
 * TODO(future): Supabase Edge Function or Vercel Cron for push when tab is closed.
 */

import { apiPaths } from "@k12/shared";
import { useEffect, useRef } from "react";

const CHECK_MS = 60 * 60 * 1000;

export function useNotifications(enabled, remindBeforeHours = [24, 2]) {
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    if (Notification.permission !== "granted") return;

    async function check() {
      const res = await fetch(apiPaths.assignmentsUpcoming, { credentials: "include" });
      if (!res.ok) return;
      const items = await res.json();
      const now = Date.now();

      for (const a of items) {
        const due = new Date(a.due_at).getTime();
        const hoursLeft = (due - now) / (1000 * 60 * 60);
        for (const h of remindBeforeHours) {
          const key = `${a.id}-${h}`;
          if (hoursLeft <= h && hoursLeft > h - 1 && !notifiedRef.current.has(key)) {
            notifiedRef.current.add(key);
            new Notification("K12 Planner", {
              body: `${a.title} is due in about ${h} hour(s).`,
              tag: key,
            });
          }
        }
      }
    }

    void check();
    const id = setInterval(() => void check(), CHECK_MS);
    return () => clearInterval(id);
  }, [enabled, remindBeforeHours]);
}

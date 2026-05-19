"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationRunner() {
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    void fetch(apiPaths.preferences, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setPrefs);
  }, []);

  useNotifications(
    prefs?.web_notifications_enabled ?? false,
    prefs?.remind_before_hours ?? [24, 2],
  );

  return null;
}

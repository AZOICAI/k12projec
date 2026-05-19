"use client";

/**
 * Purpose: Manual dark/light theme (overrides system preference when set).
 */

import { useEffect, useState } from "react";
import { applyTheme, persistTheme, readStoredTheme } from "@/lib/theme";
import { Button } from "../ui/Button";

export function ThemeToggle() {
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const stored = readStoredTheme();
    setTheme(stored);
    applyTheme(stored);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange() {
      if (readStoredTheme() === "system") applyTheme("system");
    }
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  function cycle() {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    persistTheme(next);
    applyTheme(next);
  }

  const label = theme === "system" ? "Theme: Auto" : theme === "dark" ? "Theme: Dark" : "Theme: Light";

  return (
    <Button type="button" variant="ghost" size="sm" onClick={cycle} aria-label={label}>
      {theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "◐"}
    </Button>
  );
}

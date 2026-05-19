"use client";

/**
 * Purpose: Manual dark/light theme (overrides system preference when set).
 */

import { useEffect, useState } from "react";
import { Button } from "../ui/Button";

export function ThemeToggle() {
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const stored = localStorage.getItem("k12-theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    }
  }, []);

  function cycle() {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    if (next === "system") {
      localStorage.removeItem("k12-theme");
      document.documentElement.classList.remove("dark");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    } else {
      localStorage.setItem("k12-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
    }
  }

  const label = theme === "system" ? "Theme: Auto" : theme === "dark" ? "Theme: Dark" : "Theme: Light";

  return (
    <Button type="button" variant="ghost" size="sm" onClick={cycle} aria-label={label}>
      {theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "◐"}
    </Button>
  );
}

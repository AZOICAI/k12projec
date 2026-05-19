/** Shared theme helpers for class-based dark mode (Tailwind + CSS variables). */

export const THEME_STORAGE_KEY = "k12-theme";

/** @returns {"light" | "dark" | "system"} */
export function readStoredTheme() {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return "system";
}

/** @param {"light" | "dark" | "system"} theme */
export function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.add("light");
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.classList.add("dark");
  }
}

/** @param {"light" | "dark" | "system"} theme */
export function persistTheme(theme) {
  if (theme === "system") {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

/** Inline script for layout — keeps first paint in sync with localStorage. */
export const themeInitScript = `(function(){try{var k="k12-theme",s=localStorage.getItem(k),r=document.documentElement;r.classList.remove("light","dark");if(s==="dark")r.classList.add("dark");else if(s==="light")r.classList.add("light");else if(window.matchMedia("(prefers-color-scheme: dark)").matches)r.classList.add("dark");}catch(e){}})();`;

"use client";

/**
 * Purpose: App navigation with mobile drawer.
 * Used by: app/layout.jsx
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "../ui/Button";

const navItems = [
  { href: "/app", label: "Home" },
  { href: "/app/courses", label: "Courses" },
  { href: "/app/assignments", label: "Assignments" },
  { href: "/app/calendar", label: "Calendar" },
  { href: "/app/study", label: "Study" },
  { href: "/app/settings", label: "Settings" },
];

function NavLinks({ onNavigate, className }) {
  const pathname = usePathname();
  return (
    <nav className={className}>
      {navItems.map(({ href, label }) => {
        const active = pathname === href || (href !== "/app" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              active
                ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ userEmail, signOutAction, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-900"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <span className="block h-0.5 w-5 bg-zinc-800 dark:bg-zinc-200" />
              <span className="mt-1 block h-0.5 w-5 bg-zinc-800 dark:bg-zinc-200" />
              <span className="mt-1 block h-0.5 w-5 bg-zinc-800 dark:bg-zinc-200" />
            </button>
            <Link href="/app" className="font-semibold tracking-tight">
              K12 Planner
            </Link>
            <NavLinks className="hidden gap-1 md:flex" />
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <ThemeToggle />
            <span className="hidden max-w-[140px] truncate sm:inline">{userEmail}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="secondary" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col gap-2 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="mb-2 font-semibold">Menu</p>
            <NavLinks className="flex flex-col gap-1" onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}

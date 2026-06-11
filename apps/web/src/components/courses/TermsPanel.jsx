"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

/**
 * Purpose: Manage semesters/terms and link courses optionally.
 */
export function TermsPanel() {
  const [terms, setTerms] = useState([]);
  const [name, setName] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [message, setMessage] = useState(null);

  async function load() {
    const res = await fetch(apiPaths.terms, { credentials: "include" });
    if (res.ok) setTerms(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function addTerm(e) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch(apiPaths.terms, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, starts_on: startsOn, ends_on: endsOn }),
    });
    if (!res.ok) {
      setMessage(await res.text());
      return;
    }
    setName("");
    setStartsOn("");
    setEndsOn("");
    await load();
    setMessage("Term added.");
  }

  async function deleteTerm(id) {
    setMessage(null);
    const res = await fetch(apiPaths.term(id), { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      setMessage("Could not delete term.");
      return;
    }
    await load();
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium">Terms / semesters</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Organize courses by school term. Assign a term when creating a course (optional).
        </p>
      </div>
      <form onSubmit={addTerm} className="grid gap-3 sm:grid-cols-3">
        <input
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Fall 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="date"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={startsOn}
          onChange={(e) => setStartsOn(e.target.value)}
          required
        />
        <input
          type="date"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={endsOn}
          onChange={(e) => setEndsOn(e.target.value)}
          required
        />
        <Button type="submit" className="sm:col-span-3 w-fit">
          Add term
        </Button>
      </form>
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      <ul className="text-sm text-zinc-700 dark:text-zinc-300">
        {terms.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-2 border-b border-zinc-100 py-2 dark:border-zinc-800"
          >
            <span className="min-w-0">
              <span className="font-medium">{t.name}</span>
              <span className="ml-2 text-zinc-500">
                {t.starts_on} → {t.ends_on}
              </span>
            </span>
            <button
              type="button"
              className="shrink-0 text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
              onClick={() => void deleteTerm(t.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

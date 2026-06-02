"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

function buildAssignmentText(assignment) {
  const parts = [assignment.title];
  if (assignment.notes?.trim()) parts.push(assignment.notes.trim());
  if (assignment.courses?.name) parts.push(`Course: ${assignment.courses.name}`);
  return parts.join("\n\n");
}

export function TutorChat({ assignments }) {
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "tutor",
      text: "Pick an assignment and tell me where you're stuck. I'll give hints — not full answers.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const activeAssignments = useMemo(
    () =>
      [...(assignments ?? [])]
        .filter((a) => a.status !== "done")
        .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()),
    [assignments],
  );

  const selected = useMemo(
    () => activeAssignments.find((a) => a.id === selectedId) ?? null,
    [activeAssignments, selectedId],
  );

  useEffect(() => {
    if (!selectedId && activeAssignments.length) {
      setSelectedId(activeAssignments[0].id);
    }
  }, [activeAssignments, selectedId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function askTutor(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    if (!selected) {
      setError("Select an assignment to work on first.");
      return;
    }

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const assignment_text = buildAssignmentText(selected);
      const res = await fetch(apiPaths.tutorChat, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: selected.id,
          assignment_text,
          chat_message: text,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Could not reach the tutor.");
      }

      setMessages((prev) => [...prev, { role: "tutor", text: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-[380px] flex-col rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-zinc-700/80 p-4">
        <h3 className="text-sm font-semibold text-zinc-50">AI study tutor</h3>
        <p className="mt-1 text-xs text-zinc-400">Hints only — you do the thinking.</p>
        <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-zinc-400">
          Select assignment to work on
          <select
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {activeAssignments.length === 0 ? (
              <option value="">No open assignments — add or sync on Courses</option>
            ) : (
              activeAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.courses?.name ? `${a.courses.name}: ` : ""}
                  {a.title}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-4"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[95%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading ? (
          <p className="text-xs text-zinc-500">Tutor is thinking…</p>
        ) : null}
      </div>

      <form onSubmit={(e) => void askTutor(e)} className="border-t border-zinc-700/80 p-4">
        {error ? <p className="mb-2 text-xs text-red-400">{error}</p> : null}
        <div className="flex gap-2">
          <input
            type="text"
            className="min-w-0 flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
            placeholder="What are you stuck on?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || !activeAssignments.length}
          />
          <Button type="submit" size="sm" disabled={loading || !activeAssignments.length}>
            {loading ? "…" : "Ask Tutor"}
          </Button>
        </div>
      </form>
    </div>
  );
}

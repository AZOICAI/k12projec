"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

const GENERAL_ID = "general";
const HISTORY_LIMIT = 12;

function buildAssignmentText(assignment) {
  const parts = [assignment.title];
  if (assignment.notes?.trim()) parts.push(assignment.notes.trim());
  if (assignment.courses?.name) parts.push(`Course: ${assignment.courses.name}`);
  if (assignment.grade_percent != null) {
    parts.push(`The student scored ${assignment.grade_percent}% and wants to improve it.`);
  }
  return parts.join("\n\n");
}

function isRedoCandidate(a) {
  return a.status === "done" && a.grade_percent != null && Number(a.grade_percent) < 70;
}

export function TutorChat({ assignments, initialAssignmentId = null }) {
  const [selectedId, setSelectedId] = useState(initialAssignmentId ?? "");
  const [messages, setMessages] = useState([
    {
      role: "tutor",
      text: "Pick an assignment (or general help) and tell me what you're working on or stuck on.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hintMode, setHintMode] = useState(false);
  const scrollRef = useRef(null);

  const tutorOptions = useMemo(() => {
    const open = [];
    const redos = [];
    for (const a of assignments ?? []) {
      if (a.status !== "done") open.push(a);
      else if (isRedoCandidate(a)) redos.push(a);
    }
    const byDue = (x, y) => new Date(x.due_at).getTime() - new Date(y.due_at).getTime();
    open.sort(byDue);
    redos.sort(byDue);
    return { open, redos };
  }, [assignments]);

  const allOptions = useMemo(
    () => [...tutorOptions.open, ...tutorOptions.redos],
    [tutorOptions],
  );

  const selected = useMemo(
    () => allOptions.find((a) => a.id === selectedId) ?? null,
    [allOptions, selectedId],
  );

  useEffect(() => {
    if (!selectedId && allOptions.length) {
      setSelectedId(allOptions[0].id);
    }
    if (!selectedId && !allOptions.length) {
      setSelectedId(GENERAL_ID);
    }
  }, [allOptions, selectedId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function askTutor(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput("");
    const history = messages.slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const body = {
        chat_message: text,
        history,
      };
      if (selected) {
        body.assignment_id = selected.id;
        body.assignment_text = buildAssignmentText(selected);
      }

      const res = await fetch(apiPaths.tutorChat, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Could not reach the tutor.");
      }

      setHintMode(data.source === "hints");
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
        <p className="mt-1 text-xs text-zinc-400">
          Explains concepts and walks you through it — without doing it for you.
        </p>
        <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-zinc-400">
          What are you working on?
          <select
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value={GENERAL_ID}>General study help (no assignment)</option>
            {tutorOptions.open.map((a) => (
              <option key={a.id} value={a.id}>
                {a.courses?.name ? `${a.courses.name}: ` : ""}
                {a.title}
              </option>
            ))}
            {tutorOptions.redos.map((a) => (
              <option key={a.id} value={a.id}>
                Redo — {a.courses?.name ? `${a.courses.name}: ` : ""}
                {a.title} ({a.grade_percent}%)
              </option>
            ))}
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
            className={`max-w-[95%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${
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
        {hintMode ? (
          <p className="mb-2 text-[11px] text-zinc-500">
            Basic hints mode — full AI tutor is off right now.
          </p>
        ) : null}
        <div className="flex gap-2">
          <input
            type="text"
            className="min-w-0 flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
            placeholder="Ask anything — what you're stuck on, a concept, a problem…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "…" : "Ask Tutor"}
          </Button>
        </div>
      </form>
    </div>
  );
}

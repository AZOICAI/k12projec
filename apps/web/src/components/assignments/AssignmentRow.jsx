"use client";

import { apiPaths } from "@k12/shared";
import { useState } from "react";
import { Button } from "../ui/Button";

/**
 * Purpose: List row with inline edit for an assignment.
 */
export function AssignmentRow({ assignment, courses, onUpdated, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(assignment.title);
  const [dueLocal, setDueLocal] = useState(
    assignment.due_at ? new Date(assignment.due_at).toISOString().slice(0, 16) : "",
  );
  const [notes, setNotes] = useState(assignment.notes ?? "");
  const [status, setStatus] = useState(assignment.status);

  async function save() {
    const res = await fetch(apiPaths.assignment(assignment.id), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        due_at: new Date(dueLocal).toISOString(),
        notes: notes || null,
        status,
      }),
    });
    if (res.ok) {
      setEditing(false);
      onUpdated();
    }
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-3">
          <div className="flex flex-col gap-2 text-sm">
            <input
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="datetime-local"
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={dueLocal}
              onChange={(e) => setDueLocal(e.target.value)}
            />
            <textarea
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <select
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => void save()}>
                Save
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  const notePreview =
    assignment.notes?.trim() ?
      assignment.notes.trim().length > 80
        ? `${assignment.notes.trim().slice(0, 80)}…`
        : assignment.notes.trim()
    : null;

  return (
    <tr>
      <td className="px-4 py-3">
        <div className="font-medium">{assignment.title}</div>
        {notePreview ? (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{notePreview}</p>
        ) : null}
        {assignment.source_url ? (
          <a
            href={assignment.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-block text-xs text-blue-600 hover:underline"
          >
            Open in LMS
          </a>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: assignment.courses?.color ?? "#3B82F6" }}
          />
          {assignment.courses?.name ?? "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
        {new Date(assignment.due_at).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <select
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
          value={status}
          onChange={async (e) => {
            setStatus(e.target.value);
            await fetch(apiPaths.assignment(assignment.id), {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: e.target.value }),
            });
            onUpdated();
          }}
        >
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          className="mr-2 text-xs text-blue-600 hover:underline"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
        <button type="button" className="text-xs text-red-600 hover:underline" onClick={onDelete}>
          Delete
        </button>
      </td>
    </tr>
  );
}

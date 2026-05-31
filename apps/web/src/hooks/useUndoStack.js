"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_UNDO = 25;

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/** Ctrl+Z / Cmd+Z undo for dashboard actions. */
export function useUndoStack(onUndone) {
  const stackRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);

  const pushUndo = useCallback((entry) => {
    stackRef.current.push(entry);
    if (stackRef.current.length > MAX_UNDO) {
      stackRef.current.shift();
    }
    setCanUndo(true);
  }, []);

  const undo = useCallback(async () => {
    const entry = stackRef.current.pop();
    if (!entry) {
      setCanUndo(false);
      return false;
    }
    setCanUndo(stackRef.current.length > 0);
    await entry.run();
    onUndone?.();
    return true;
  }, [onUndone]);

  useEffect(() => {
    function onKeyDown(e) {
      if (!(e.ctrlKey || e.metaKey) || e.key !== "z" || e.shiftKey) return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      void undo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo]);

  return { pushUndo, undo, canUndo };
}

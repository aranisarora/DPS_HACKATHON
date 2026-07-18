"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Checkbox that flips a task between open and done via PATCH /api/tasks. */
export function TaskDoneToggle({
  taskId,
  status,
}: {
  taskId: string;
  status: "open" | "in_progress" | "done" | "cancelled";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const done = status === "done";
  // Only open ⇄ done are toggleable; other states render a disabled box.
  const toggleable = status === "open" || status === "done";

  async function toggle() {
    if (busy || !toggleable) return;
    setBusy(true);
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task_id: taskId, status: done ? "open" : "done" }),
    }).catch(() => {});
    router.refresh();
    setBusy(false);
  }

  return (
    <input
      type="checkbox"
      checked={done}
      onChange={toggle}
      disabled={busy || !toggleable}
      aria-label={done ? "Mark task open" : "Mark task done"}
      className="h-4 w-4 shrink-0 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
    />
  );
}

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * Quick-add task — collapsible form, same expand pattern as send-bot.tsx.
 * Posts to /api/tasks and refreshes the (server-rendered) task list.
 */
export function TaskForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  const inputCls =
    "w-full rounded-memo border border-desk-line bg-desk-raised px-3 py-2 text-sm text-paper placeholder:text-sage/60 focus:outline-none focus:ring-2 focus:ring-brass/60 [color-scheme:dark]";

  const save = useCallback(async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    setNote(null);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        detail: detail.trim() || undefined,
        assignee_name: assignee.trim() || undefined,
        due_date: dueDate || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok) {
      setTitle("");
      setDetail("");
      setAssignee("");
      setDueDate("");
      setNote({ text: "Task added", ok: true });
      router.refresh();
    } else {
      setNote({ text: "Couldn't add the task — try again", ok: false });
    }
    setSaving(false);
  }, [title, detail, assignee, dueDate, saving, router]);

  return (
    <div className="mt-6">
      {!open ? (
        <Button
          variant="outline"
          size="sm"
          className="border-sage/40 text-sage hover:border-brass hover:text-brass"
          onClick={() => setOpen(true)}
        >
          Add task
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-2 rounded-memo border border-desk-line bg-desk-raised/60 p-4"
          >
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="What needs doing?"
              maxLength={200}
              className={inputCls}
            />
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Detail (optional)"
              rows={2}
              className={inputCls}
            />
            <div className="flex gap-2">
              <input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Assignee (optional)"
                className={inputCls}
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={saving || !title.trim()}>
                {saving ? "Adding…" : "Add task"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-sage hover:bg-paper/5 hover:text-paper"
                onClick={() => {
                  setOpen(false);
                  setNote(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      {note && (
        <p className={`mt-2 text-xs ${note.ok ? "text-sage" : "text-pencil"}`}>
          {note.text}
        </p>
      )}
    </div>
  );
}

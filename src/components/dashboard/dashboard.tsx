"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Orb, type OrbMood } from "@/components/orb/orb";
import { ActionCard } from "./action-card";
import { TimeSavedCounter } from "./time-saved-counter";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProposedAction } from "@/lib/types";

export function Dashboard({
  userEmail,
  initialPending,
  initialRecent,
  initialWeeklyMinutes,
}: {
  userEmail: string;
  initialPending: ProposedAction[];
  initialRecent: ProposedAction[];
  initialWeeklyMinutes: number;
}) {
  const [pending, setPending] = useState(initialPending);
  const [recent, setRecent] = useState(initialRecent);
  const [weeklyMinutes, setWeeklyMinutes] = useState(initialWeeklyMinutes);
  const [mood, setMood] = useState<OrbMood>("idle");
  const [seeding, setSeeding] = useState(false);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulse = useCallback((m: OrbMood, ms = 1600) => {
    if (moodTimer.current) clearTimeout(moodTimer.current);
    setMood(m);
    moodTimer.current = setTimeout(() => setMood("idle"), ms);
  }, []);

  // Orb ripples when new proposals arrive
  const prevCount = useRef(initialPending.length);
  useEffect(() => {
    if (pending.length > prevCount.current) pulse("ripple");
    prevCount.current = pending.length;
  }, [pending.length, pulse]);

  const decide = useCallback(
    async (action: ProposedAction, decision: "approve" | "edit" | "skip", editedParams?: Record<string, unknown>) => {
      // Optimistic: card folds away as the orb reacts
      setPending((p) => p.filter((a) => a.id !== action.id));
      if (decision === "skip") {
        pulse("skip", 900);
      } else {
        setMood("executing");
      }

      const res = await fetch("/api/actions/decide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action_id: action.id,
          decision,
          edited_params: editedParams,
        }),
      });
      const data = await res.json().catch(() => ({ ok: false }));

      if (decision !== "skip") {
        if (data.ok) {
          pulse("approve");
          setWeeklyMinutes((m) => m + (data.minutes_saved ?? action.minutes_saved));
          setRecent((r) => [{ ...action, status: "executed" as const }, ...r].slice(0, 12));
        } else {
          pulse("skip", 900);
          setRecent((r) => [{ ...action, status: "failed" as const, error: data.error }, ...r].slice(0, 12));
        }
      } else {
        setRecent((r) => [{ ...action, status: "skipped" as const }, ...r].slice(0, 12));
      }
    },
    [pulse]
  );

  const seedDemo = useCallback(async () => {
    setSeeding(true);
    const res = await fetch("/api/seed", { method: "POST" });
    if (res.ok) window.location.reload();
    else setSeeding(false);
  }, []);

  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const syncNow = useCallback(async () => {
    setSyncing(true);
    setSyncNote(null);
    const res = await fetch("/api/sync/gmail", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSyncNote(data.demo ? "Google not connected yet" : data.ok ? "Inbox synced" : "Sync failed");
    setSyncing(false);
    pulse("ripple");
  }, [pulse]);

  return (
    <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
      {/* Orb + counter — docked beside the feed */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col items-center text-center">
          <Orb mood={mood} size={280} />
          <TimeSavedCounter minutes={weeklyMinutes} />
          <p className="mt-1 text-sm text-ink-soft">saved this week</p>
        </div>
      </aside>

      {/* Approval Inbox — the product */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight">
              Needs your OK
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {pending.length === 0
                ? "All clear. Donna will ripple when something new arrives."
                : `${pending.length} action${pending.length === 1 ? "" : "s"} waiting — approve, edit or skip.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {syncNote && <span className="text-xs text-ink-soft">{syncNote}</span>}
            <Button variant="outline" size="sm" onClick={syncNow} disabled={syncing}>
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        </div>

        {pending.length === 0 && recent.length === 0 && (
          <Card className="flex flex-col items-center gap-4 p-12 text-center">
            <p className="font-display text-xl">Nothing here yet.</p>
            <p className="max-w-sm text-sm text-ink-soft">
              Donna proposes actions when meetings end or emails arrive. Load
              the demo meeting to see the full loop — transcript to approved
              actions in one tap.
            </p>
            <Button onClick={seedDemo} disabled={seeding}>
              {seeding ? "Seeding…" : "Load demo meeting"}
            </Button>
          </Card>
        )}

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {pending.map((action) => (
              <motion.div
                key={action.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <ActionCard action={action} onDecide={decide} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* History with per-action minute chips */}
        {recent.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 font-display text-xl font-medium">Recent</h2>
            <Card className="divide-y divide-ink/[0.06]">
              {recent.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{a.title}</p>
                    <p className="text-xs text-ink-soft">
                      {a.status === "executed"
                        ? "Done"
                        : a.status === "skipped"
                          ? "Skipped"
                          : "Failed"}
                    </p>
                  </div>
                  {a.status === "executed" && (
                    <Chip className="shrink-0 bg-accent-soft text-accent">
                      +{a.minutes_saved} min
                    </Chip>
                  )}
                </div>
              ))}
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}

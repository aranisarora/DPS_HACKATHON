"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Orb, type OrbMood } from "@/components/orb/orb";
import { ActionCard } from "./action-card";
import { SendBot } from "./send-bot";
import { TellDonna } from "./tell-donna";
import { TimeSavedCounter } from "./time-saved-counter";
import { ReconnectGoogle } from "@/components/reconnect-google";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProposedAction } from "@/lib/types";

export type GoogleStatus = "connected" | "revoked" | "none";

export function Dashboard({
  userEmail,
  initialPending,
  initialRecent,
  initialWeeklyMinutes,
  googleStatus,
  googleLive,
}: {
  userEmail: string;
  initialPending: ProposedAction[];
  initialRecent: ProposedAction[];
  initialWeeklyMinutes: number;
  googleStatus: GoogleStatus;
  googleLive: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(initialPending);
  const [recent, setRecent] = useState<(ProposedAction & { demo?: boolean })[]>(initialRecent);
  const [weeklyMinutes, setWeeklyMinutes] = useState(initialWeeklyMinutes);
  const [mood, setMood] = useState<OrbMood>("idle");
  const [seeding, setSeeding] = useState(false);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // router.refresh() re-renders the server page — sync fresh props into state
  useEffect(() => setPending(initialPending), [initialPending]);
  useEffect(() => setRecent(initialRecent), [initialRecent]);

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
          setRecent((r) =>
            [{ ...action, status: "executed" as const, demo: data.demo === true }, ...r].slice(0, 12)
          );
        } else {
          pulse("skip", 900);
          setRecent((r) => [{ ...action, status: "failed" as const, error: data.error }, ...r].slice(0, 12));
          // Google may have just been revoked — refresh so the banner appears
          router.refresh();
        }
      } else {
        setRecent((r) => [{ ...action, status: "skipped" as const }, ...r].slice(0, 12));
      }
    },
    [pulse, router]
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
    setSyncNote(
      data.demo
        ? "Google not configured yet"
        : data.connected === false
          ? "Sign out and back in to connect Google"
          : data.baselined
            ? "Inbox connected — new mail syncs from now"
            : data.ok
              ? data.new_messages > 0
                ? `${data.new_messages} new message${data.new_messages === 1 ? "" : "s"}`
                : "Inbox up to date"
              : "Sync failed"
    );
    setSyncing(false);
    pulse("ripple");
  }, [pulse]);

  return (
    <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
      {/* Donna's corner of the desk — orb, ledger total, the bot dispatch */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 m-auto h-56 w-56 rounded-full shadow-lamp"
            />
            <Orb mood={mood} size={280} />
          </div>
          <TimeSavedCounter minutes={weeklyMinutes} />
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-sage/80">
            this week
          </p>
          <SendBot onSent={() => pulse("ripple")} />
          <TellDonna
            onIngested={() => {
              pulse("ripple");
              router.refresh();
            }}
          />
        </div>
      </aside>

      {/* Approval Inbox — the product */}
      <section>
        {googleLive && googleStatus !== "connected" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-amber-900">
                {googleStatus === "revoked"
                  ? "Google access was revoked"
                  : "Google isn't connected"}
              </p>
              <p className="text-xs text-amber-700">
                Approved email and calendar actions will fail until you reconnect.
              </p>
            </div>
            <ReconnectGoogle />
          </div>
        )}

        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight">
              Needs your <span className="italic text-brass-bright">OK</span>
            </h1>
            <p className="mt-1 text-sm text-sage">
              {pending.length === 0
                ? "All clear. Donna will ripple when something new arrives."
                : `${pending.length} memo${pending.length === 1 ? "" : "s"} on your desk — approve, edit or skip.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {syncNote && <span className="text-xs text-sage">{syncNote}</span>}
            <Button
              variant="outline"
              size="sm"
              className="border-sage/40 text-sage hover:border-brass hover:text-brass"
              onClick={syncNow}
              disabled={syncing}
            >
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        </div>

        {pending.length === 0 && recent.length === 0 && (
          <Card className="paper-ruled flex flex-col items-center gap-4 p-12 text-center">
            <p className="font-display text-xl italic">A clean desk.</p>
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

        {/* The ledger — what's been filed, with minutes credited */}
        {recent.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.28em] text-brass">
              The ledger
            </h2>
            <Card className="divide-y divide-paper-line">
              {recent.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{a.title}</p>
                    <p
                      className={`font-mono text-[11px] uppercase tracking-wider ${
                        a.status === "failed" ? "text-pencil" : "text-ink-soft"
                      }`}
                    >
                      {a.status === "executed"
                        ? a.demo
                          ? "Done · simulated — Google/Slack not connected"
                          : "Done"
                        : a.status === "skipped"
                          ? "Skipped"
                          : a.error
                            ? `Failed — ${a.error}`
                            : "Failed"}
                    </p>
                  </div>
                  {a.status === "executed" && (
                    <Chip className="shrink-0 text-brass-deep">+{a.minutes_saved} min</Chip>
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

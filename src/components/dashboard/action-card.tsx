"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { TierBadge, Chip } from "@/components/ui/badge";
import { Stamp } from "@/components/ui/stamp";
import { Button } from "@/components/ui/button";
import type { ProposedAction } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  recap_email: "Recap email",
  follow_up_booking: "Follow-up booking",
  task_assignment: "Task assignment",
  absentee_update: "Absentee update",
  slack_summary: "Slack post",
  email_reply: "Email reply",
  calendar_block: "Calendar block",
  agenda_add: "Agenda",
  daily_brief: "Daily brief",
  other: "Action",
};

/* How long the stamp sits on the memo before it files away. */
const STAMP_DWELL_MS = 650;

export function ActionCard({
  action,
  onDecide,
}: {
  action: ProposedAction;
  onDecide: (
    action: ProposedAction,
    decision: "approve" | "edit" | "skip",
    editedParams?: Record<string, unknown>
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [verdict, setVerdict] = useState<"approve" | "skip" | null>(null);
  const decided = useRef(false);
  const [draft, setDraft] = useState(() => {
    const p = action.params as Record<string, unknown>;
    return (p.body as string) ?? (p.text as string) ?? "";
  });
  const params = action.params as Record<string, unknown>;
  const isSuggestion = action.tier === "suggest";
  const editable = typeof params.body === "string" || typeof params.text === "string";

  // The stamp thuds onto the memo first; the decision fires once it has landed.
  function stampThen(
    decision: "approve" | "edit" | "skip",
    editedParams?: Record<string, unknown>
  ) {
    if (decided.current) return;
    decided.current = true;
    setVerdict(decision === "skip" ? "skip" : "approve");
    setTimeout(() => onDecide(action, decision, editedParams), STAMP_DWELL_MS);
  }

  return (
    <Card className="relative overflow-hidden p-6 transition-shadow hover:shadow-memo-lift">
      {/* The verdict, slammed on */}
      {verdict && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper/40">
          <Stamp slam color={verdict === "approve" ? "brass" : "pencil"}>
            {verdict === "approve" ? "Approved · Donna" : "Skipped"}
          </Stamp>
        </div>
      )}

      <div className={verdict ? "opacity-60" : undefined}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                {TYPE_LABELS[action.action_type] ?? action.action_type}
              </span>
              <TierBadge tier={action.tier} />
              <Chip>+{action.minutes_saved} min</Chip>
            </div>
            <h3 className="font-display text-lg font-medium leading-snug">{action.title}</h3>
            {action.description && (
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{action.description}</p>
            )}
          </div>
        </div>

        {/* Source quote — why Donna proposed this */}
        {action.source_quote && (
          <blockquote className="mt-4 border-l-2 border-brass/60 pl-3 font-display text-sm italic text-ink-soft">
            “{action.source_quote}”
          </blockquote>
        )}

        {/* Draft preview / editor */}
        {editable && !editing && (
          <pre className="paper-ruled mt-4 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-memo border border-paper-line bg-paper-shade/40 p-4 font-sans text-sm leading-[28px] text-ink/90">
            {draft}
          </pre>
        )}
        {editing && (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            className="mt-4 w-full rounded-memo border border-brass/50 bg-paper p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brass/60"
          />
        )}

        <div className="mt-5 flex items-center gap-2">
          {!isSuggestion && !editing && (
            <>
              <Button onClick={() => stampThen("approve")}>Approve</Button>
              {editable && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              )}
              <Button variant="ghost" onClick={() => stampThen("skip")}>
                Skip
              </Button>
            </>
          )}
          {editing && (
            <>
              <Button
                onClick={() => {
                  const key = typeof params.body === "string" ? "body" : "text";
                  setEditing(false);
                  stampThen("edit", { [key]: draft });
                }}
              >
                Approve edited
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          )}
          {isSuggestion && (
            <>
              <span className="text-xs text-ink-soft">
                Donna can&apos;t do this one herself — flagged for you.
              </span>
              <Button variant="ghost" size="sm" onClick={() => stampThen("skip")}>
                Dismiss
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

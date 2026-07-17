"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { TierBadge, Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProposedAction } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  recap_email: "✉️ Recap email",
  follow_up_booking: "📅 Follow-up booking",
  task_assignment: "✅ Task assignment",
  absentee_update: "👋 Absentee update",
  slack_summary: "💬 Slack post",
  email_reply: "↩️ Email reply",
  calendar_block: "🕑 Calendar block",
  agenda_add: "📋 Agenda",
  daily_brief: "☀️ Daily brief",
  other: "• Action",
};

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
  const [draft, setDraft] = useState(() => {
    const p = action.params as Record<string, unknown>;
    return (p.body as string) ?? (p.text as string) ?? "";
  });
  const params = action.params as Record<string, unknown>;
  const isSuggestion = action.tier === "suggest";
  const editable = typeof params.body === "string" || typeof params.text === "string";

  return (
    <Card className="overflow-hidden p-6 transition-shadow hover:ring-iridescent">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-soft">
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
        <blockquote className="mt-4 border-l-2 border-accent/40 pl-3 text-sm italic text-ink-soft">
          “{action.source_quote}”
        </blockquote>
      )}

      {/* Draft preview / editor */}
      {editable && !editing && (
        <pre className="mt-4 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-ink/[0.03] p-4 font-sans text-sm leading-relaxed text-ink/90">
          {draft}
        </pre>
      )}
      {editing && (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          className="mt-4 w-full rounded-xl border border-accent/30 bg-white p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      )}

      <div className="mt-5 flex items-center gap-2">
        {!isSuggestion && !editing && (
          <>
            <Button onClick={() => onDecide(action, "approve")}>Approve</Button>
            {editable && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
            <Button variant="ghost" onClick={() => onDecide(action, "skip")}>
              Skip
            </Button>
          </>
        )}
        {editing && (
          <>
            <Button
              onClick={() => {
                const key = typeof params.body === "string" ? "body" : "text";
                onDecide(action, "edit", { [key]: draft });
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
            <Button variant="ghost" size="sm" onClick={() => onDecide(action, "skip")}>
              Dismiss
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

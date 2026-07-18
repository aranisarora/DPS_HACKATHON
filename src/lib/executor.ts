import { createAdminClient } from "./supabase/admin";
import { getGoogleAccessToken } from "./google/tokens";
import { mayFire } from "./autonomy/router";
import { sanitizeCalendarParams } from "./autonomy/sanitize";
import { parseCalendarParams } from "./schemas";
import { createCalendarEvent, type CalendarEventParams } from "./adapters/calendar";
import { sendEmail, type SendEmailParams } from "./adapters/gmail";
import { postSlackMessage, type SlackMessageParams } from "./adapters/slack";
import { isDemoMode, type AdapterResult } from "./adapters";
import type { ProposedAction } from "./types";

/** Human-readable messages for Google token failures (shown on the card). */
const TOKEN_ERRORS: Record<string, string> = {
  not_connected: "Google not connected — connect in Settings to run this live",
  revoked: "Google connection revoked — reconnect in Settings",
  refresh_failed: "Couldn't refresh Google access — reconnect in Settings",
  decrypt_failed: "Stored Google credentials are unreadable — reconnect in Settings",
};

/**
 * ===== The executor =====
 * Single choke point between "an action exists" and "something fired".
 * 1. Re-checks mayFire() — belt and braces on top of the router.
 * 2. Marks the row `executing` with a status guard (idempotent: a second
 *    concurrent call finds no row to claim and no-ops).
 * 3. Runs the adapter with the action's idempotency key.
 * 4. Writes result + audit_log entry.
 */
export async function executeAction(
  actionId: string,
  opts: { approvedByOwner: boolean }
): Promise<{ ok: boolean; result?: AdapterResult; error?: string }> {
  const db = createAdminClient();

  const { data: action, error: fetchErr } = await db
    .from("proposed_actions")
    .select("*")
    .eq("id", actionId)
    .single<ProposedAction>();
  if (fetchErr || !action) return { ok: false, error: "Action not found" };

  // ===== THE GATE =====
  if (!mayFire({ tier: action.tier, status: action.status, approvedByOwner: opts.approvedByOwner })) {
    await audit(db, action, "blocked", { reason: "mayFire returned false" });
    return { ok: false, error: "Fire gate refused this action" };
  }

  // Claim the row (idempotency: only one caller can flip it to executing)
  const { data: claimed } = await db
    .from("proposed_actions")
    .update({ status: "executing" })
    .eq("id", actionId)
    .in("status", ["proposed", "approved", "edited"])
    .select("id");
  if (!claimed?.length) return { ok: false, error: "Action already executing or done" };

  let result: AdapterResult;
  const auditExtra: Record<string, unknown> = {};
  try {
    result = await runAdapter(action, opts.approvedByOwner, auditExtra);
  } catch (err) {
    result = { ok: false, demo: false, error: String(err) };
  }

  await db
    .from("proposed_actions")
    .update({
      status: result.ok ? "executed" : "failed",
      executed_at: result.ok ? new Date().toISOString() : null,
      error: result.error ?? null,
    })
    .eq("id", actionId);

  await audit(db, action, result.ok ? "fired" : "failed", {
    demo: result.demo,
    external_id: result.external_id,
    detail: result.detail,
    error: result.error,
    ...auditExtra,
  });

  return { ok: result.ok, result, error: result.error };
}

/**
 * Resolves the Google token for live mode. Demo mode (explicit flag or
 * unconfigured OAuth app) simulates with a null token; a token failure in
 * live mode FAILS CLOSED — no silent demo fallback.
 */
async function resolveGoogleToken(
  userId: string,
  auditExtra: Record<string, unknown>
): Promise<{ token: string | null; failure?: AdapterResult }> {
  if (isDemoMode("google")) return { token: null };
  const res = await getGoogleAccessToken(userId);
  if (res.ok) return { token: res.token };
  auditExtra.reason = res.reason;
  return {
    token: null,
    failure: { ok: false, demo: false, error: TOKEN_ERRORS[res.reason] ?? "Google connection unavailable" },
  };
}

async function runAdapter(
  action: ProposedAction,
  approvedByOwner: boolean,
  auditExtra: Record<string, unknown>
): Promise<AdapterResult> {
  const p = action.params as Record<string, unknown>;
  const key = action.idempotency_key;

  switch (action.action_type) {
    case "follow_up_booking":
    case "calendar_block":
    case "agenda_add": {
      // Belt-and-braces re-validation (edited params also pass through here):
      // never hand the Google API a half-formed event.
      const parsedCal = parseCalendarParams(p, action.title);
      if (!parsedCal.success) {
        const detail = parsedCal.error.issues
          .map((i) => `${i.path.join(".") || "params"}: ${i.message}`)
          .join("; ");
        return { ok: false, demo: false, error: `Calendar event details invalid — ${detail}` };
      }
      const { token, failure } = await resolveGoogleToken(action.user_id, auditExtra);
      if (failure) return failure;
      // Never email invites to attendees the owner hasn't approved — holds
      // even if the model mislabeled blast_radius and the action auto-fired.
      const { params: safeParams, stripped_attendees } = sanitizeCalendarParams(
        parsedCal.data as CalendarEventParams,
        approvedByOwner
      );
      if (stripped_attendees) auditExtra.stripped_attendees = stripped_attendees;
      // Datetimes without an explicit UTC offset need a timeZone or Google 400s
      if (!hasUtcOffset(safeParams.start) || !hasUtcOffset(safeParams.end)) {
        safeParams.timeZone = await getUserTimezone(action.user_id);
      }
      return createCalendarEvent(token, safeParams, key);
    }

    case "recap_email":
    case "absentee_update":
    case "email_reply": {
      const { token, failure } = await resolveGoogleToken(action.user_id, auditExtra);
      if (failure) return failure;
      return sendEmail(token, p as unknown as SendEmailParams, key);
    }

    case "slack_summary":
      return postSlackMessage(p as unknown as SlackMessageParams, key);

    case "task_assignment": {
      // Our DB is the source of truth for assignments (Google Tasks can't
      // assign to others). Create the task row; notify via email/Slack.
      const db = createAdminClient();
      const { error } = await db.from("tasks").insert({
        user_id: action.user_id,
        source_id: action.source_id,
        proposed_action_id: action.id,
        title: (p.title as string) ?? action.title,
        detail: (p.detail as string) ?? action.description,
        assignee_name: (p.assignee_name as string) ?? null,
        // tasks.due_date is a Postgres date — LLM due hints can be natural
        // language ("Friday"), which would fail the insert
        due_date: toIsoDate(p.due_date),
        source_quote: action.source_quote,
      });
      if (error) return { ok: false, demo: false, error: error.message };
      // Notification is drafted as a separate approve-gated action
      return { ok: true, demo: false, detail: "Task created in Donna (source of truth)" };
    }

    case "daily_brief":
      return { ok: true, demo: false, detail: "Brief compiled (read-only)" };

    default:
      return { ok: false, demo: false, error: `No adapter for ${action.action_type}` };
  }
}

/** "2026-07-19T15:00:00+05:30" or "...Z" → true; bare local datetimes → false. */
function hasUtcOffset(iso: string): boolean {
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso);
}

async function getUserTimezone(userId: string): Promise<string> {
  const db = createAdminClient();
  const { data } = await db.from("profiles").select("settings").eq("id", userId).single();
  return data?.settings?.timezone ?? process.env.DONNA_DEFAULT_TIMEZONE ?? "UTC";
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

async function audit(
  db: ReturnType<typeof createAdminClient>,
  action: ProposedAction,
  event: string,
  detail: Record<string, unknown>
) {
  await db.from("audit_log").insert({
    user_id: action.user_id,
    proposed_action_id: action.id,
    event,
    actor: event === "fired" || event === "failed" ? "donna" : "system",
    detail,
  });
}

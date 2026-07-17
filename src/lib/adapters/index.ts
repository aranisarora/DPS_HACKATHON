import type { ActionType } from "../types";

/**
 * ===== Executor adapters =====
 *
 * Every adapter is idempotent (callers pass the proposed_action's
 * idempotency_key) and returns a structured result. Nothing here runs
 * unless autonomy/router.mayFire() said yes — the executor enforces that.
 *
 * When an integration's env keys are missing, adapters run in DEMO MODE:
 * they simulate success and mark the result demo=true, so the whole
 * pipeline (and the live demo) works before Google/Slack/Recall are wired.
 */

export interface AdapterResult {
  ok: boolean;
  demo: boolean; // true = simulated (integration not configured)
  external_id?: string; // Google event id / Gmail message id / Slack ts
  detail?: string;
  error?: string;
}

export interface ExecuteParams {
  idempotencyKey: string;
  actionType: ActionType;
  params: Record<string, unknown>;
  userId: string;
}

/** Retry helper with exponential backoff for Google/Slack/Recall calls. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseMs = 500
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, baseMs * 2 ** i));
      }
    }
  }
  throw lastErr;
}

export function isDemoMode(integration: "google" | "slack" | "recall"): boolean {
  switch (integration) {
    case "google":
      return !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET;
    case "slack":
      return !process.env.SLACK_BOT_TOKEN;
    case "recall":
      return !process.env.RECALL_API_KEY;
  }
}

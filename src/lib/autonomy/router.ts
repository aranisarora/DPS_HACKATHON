import type { ActionType, BlastRadius, Tier } from "../types";

/**
 * ===== THE AUTONOMY ROUTER — Donna's only real IP =====
 *
 * Deterministic three-tier gate. The model proposes confidence and risk
 * fields; THIS code decides fire / don't-fire. The model never autonomously
 * sends external communication.
 *
 * Core design decision: importance must NOT increase autonomy.
 *   how autonomous = feasibility × confidence × reversibility (blast radius)
 *   how urgent     = importance × time-sensitivity → ordering only, never autonomy
 */

export interface RoutingInput {
  action_type: ActionType;
  confidence: number; // 0..1, model-proposed
  blast_radius: BlastRadius; // internal | team | external
  reversible: boolean;
  /** Do we have a working integration to execute this? */
  feasible: boolean;
  /** Owner-tunable thresholds (Settings). */
  thresholds?: { auto_confidence_min?: number; draft_confidence_min?: number };
}

const DEFAULT_AUTO_MIN = 0.85;
const DEFAULT_DRAFT_MIN = 0.6;

/**
 * Action types that may NEVER auto-execute, regardless of scores.
 * Anything that leaves the owner's workspace requires approval.
 */
const NEVER_AUTO: ReadonlySet<ActionType> = new Set([
  "recap_email",
  "follow_up_booking", // sends invites to others
  "absentee_update",
  "slack_summary", // visible to the team
  "email_reply",
]);

/**
 * Action types that are internal + reversible by construction and thus
 * eligible for auto-execution when confidence is high.
 */
const AUTO_ELIGIBLE: ReadonlySet<ActionType> = new Set([
  "calendar_block", // own calendar only
  "agenda_add",
  "task_assignment", // creating the task row is internal; NOTIFYING is a separate approve-gated action
  "daily_brief", // read-only
]);

export function routeAction(input: RoutingInput): Tier {
  const autoMin = input.thresholds?.auto_confidence_min ?? DEFAULT_AUTO_MIN;
  const draftMin = input.thresholds?.draft_confidence_min ?? DEFAULT_DRAFT_MIN;

  // No integration → we can only suggest.
  if (!input.feasible) return "suggest";

  // Low confidence → suggest only, whatever the action.
  if (input.confidence < draftMin) return "suggest";

  // External blast radius or irreversible → never auto. High-enough
  // confidence earns draft-and-approve; otherwise suggest.
  if (input.blast_radius === "external" || !input.reversible) {
    return "approve";
  }

  // Hard deny-list beats scores: outbound communication always needs a tap.
  if (NEVER_AUTO.has(input.action_type)) return "approve";

  // Auto requires: eligible type + internal blast radius + high confidence.
  if (
    AUTO_ELIGIBLE.has(input.action_type) &&
    input.blast_radius === "internal" &&
    input.confidence >= autoMin
  ) {
    return "auto";
  }

  // Team-visible or medium confidence → approve.
  return "approve";
}

/**
 * Final fire gate, called immediately before any adapter executes.
 * Belt-and-braces: even an approved action re-checks its invariants.
 */
export function mayFire(params: {
  tier: Tier;
  status: string;
  approvedByOwner: boolean;
}): boolean {
  if (params.tier === "suggest") return false; // suggestions never fire
  if (params.tier === "auto") return params.status === "proposed" || params.approvedByOwner;
  // approve tier requires an explicit owner decision
  return params.approvedByOwner && (params.status === "approved" || params.status === "edited");
}

/** Urgency affects ORDERING in the inbox only — never autonomy. */
export function urgencyScore(params: {
  importance?: number; // 0..1
  due_hint?: string | null;
}): number {
  const importance = params.importance ?? 0.5;
  let timeSensitivity = 0.3;
  if (params.due_hint) {
    const due = Date.parse(params.due_hint);
    if (!Number.isNaN(due)) {
      const hoursOut = (due - Date.now()) / 36e5;
      timeSensitivity = hoursOut < 24 ? 1 : hoursOut < 72 ? 0.7 : 0.4;
    }
  }
  return importance * timeSensitivity;
}

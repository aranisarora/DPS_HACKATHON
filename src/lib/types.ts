// ===== Donna domain types =====

export type ActionType =
  | "recap_email"
  | "follow_up_booking"
  | "task_assignment"
  | "absentee_update"
  | "slack_summary"
  | "email_reply"
  | "calendar_block"
  | "agenda_add"
  | "daily_brief"
  | "other";

export type BlastRadius = "internal" | "team" | "external";
export type Tier = "auto" | "approve" | "suggest";
export type ActionStatus =
  | "proposed"
  | "approved"
  | "edited"
  | "executing"
  | "executed"
  | "skipped"
  | "failed";

export interface ProposedAction {
  id: string;
  user_id: string;
  source_id: string | null;
  action_type: ActionType;
  title: string;
  description: string | null;
  params: Record<string, unknown>;
  source_quote: string | null;
  confidence: number;
  blast_radius: BlastRadius;
  reversible: boolean;
  tier: Tier;
  status: ActionStatus;
  minutes_saved: number;
  idempotency_key: string;
  executed_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  source_id: string | null;
  proposed_action_id: string | null;
  title: string;
  detail: string | null;
  assignee_contact_id: string | null;
  assignee_name: string | null;
  due_date: string | null;
  status: "open" | "in_progress" | "done" | "cancelled";
  source_quote: string | null;
  notified_at: string | null;
  created_at: string;
}

export interface Source {
  id: string;
  user_id: string;
  kind: "meeting" | "email" | "manual";
  title: string;
  raw: Record<string, unknown>;
  participants: Array<{ name: string; email?: string }>;
  occurred_at: string;
  processed: boolean;
}

export interface Contact {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  inferred_role: string | null;
  interaction_count: number;
  is_teammate: boolean;
  teammate_confirmed: boolean;
}

import type { ActionType } from "./types";

/** Honest default estimates, tunable per-user in Settings. */
export const DEFAULT_MINUTES_SAVED: Record<ActionType, number> = {
  recap_email: 15,
  follow_up_booking: 10,
  task_assignment: 5,
  absentee_update: 10,
  slack_summary: 5,
  email_reply: 8,
  calendar_block: 3,
  agenda_add: 3,
  daily_brief: 10,
  other: 5,
};

export function minutesSavedFor(
  type: ActionType,
  overrides?: Partial<Record<ActionType, number>>
): number {
  return overrides?.[type] ?? DEFAULT_MINUTES_SAVED[type];
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

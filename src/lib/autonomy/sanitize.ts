/**
 * ===== Param sanitizers =====
 * Deterministic guards applied in the executor, after the router. They make
 * the "external sends never auto-fire" invariant hold in CODE even if the
 * model mislabels blast_radius: an auto-fired calendar action must never
 * email invites to attendees the owner hasn't approved.
 */

export interface SanitizeResult<T> {
  params: T;
  /** Attendees removed because the owner hasn't approved the action; null if nothing was stripped. */
  stripped_attendees: string[] | null;
}

export function sanitizeCalendarParams<T extends { attendees?: unknown }>(
  params: T,
  approvedByOwner: boolean
): SanitizeResult<T> {
  const attendees = Array.isArray(params.attendees)
    ? (params.attendees as string[])
    : null;

  if (approvedByOwner || !attendees || attendees.length === 0) {
    return { params, stripped_attendees: null };
  }

  const { attendees: _dropped, ...rest } = params;
  return { params: rest as unknown as T, stripped_attendees: attendees };
}

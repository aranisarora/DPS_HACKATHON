import { withRetry, isDemoMode, type AdapterResult } from "./index";

export interface CalendarEventParams {
  summary: string;
  description?: string;
  start: string; // ISO
  end: string; // ISO
  attendees?: string[]; // emails; empty for own-calendar blocks
  /** IANA tz; required by Google when start/end lack an explicit UTC offset. */
  timeZone?: string;
}

/**
 * Google Calendar adapter. Uses the owner's stored OAuth token
 * (google_connections, decrypted server-side).
 */
export async function createCalendarEvent(
  accessToken: string | null,
  params: CalendarEventParams,
  idempotencyKey: string
): Promise<AdapterResult> {
  // Demo mode only via explicit flag / unconfigured OAuth app. A missing user
  // token is handled upstream by the executor (fail closed) — never here.
  if (isDemoMode("google")) {
    return {
      ok: true,
      demo: true,
      external_id: `demo-event-${idempotencyKey.slice(0, 8)}`,
      detail: `[demo] Would create "${params.summary}" ${params.start} → ${params.end}${
        params.attendees?.length ? ` with ${params.attendees.join(", ")}` : ""
      }`,
    };
  }

  if (!accessToken) {
    return { ok: false, demo: false, error: "No Google access token (executor should have failed closed)" };
  }

  try {
    const event = await withRetry(async () => {
      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            summary: params.summary,
            description: params.description,
            start: { dateTime: params.start, ...(params.timeZone && { timeZone: params.timeZone }) },
            end: { dateTime: params.end, ...(params.timeZone && { timeZone: params.timeZone }) },
            attendees: params.attendees?.map((email) => ({ email })),
            // Idempotency: deterministic client-supplied id prevents double-books
            id: idempotencyKey.replace(/-/g, "").slice(0, 26).toLowerCase(),
          }),
        }
      );
      if (res.status === 409) return { id: "already-exists", conflict: true };
      if (!res.ok) throw new Error(`Calendar API ${res.status}: ${await res.text()}`);
      return res.json();
    });
    return { ok: true, demo: false, external_id: event.id };
  } catch (err) {
    return { ok: false, demo: false, error: String(err) };
  }
}

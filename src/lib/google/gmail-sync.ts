import { createAdminClient } from "../supabase/admin";
import { getGoogleAccessToken } from "./tokens";
import { processSource } from "../pipeline";

/**
 * ===== Gmail incremental sync =====
 *
 * First run stores the mailbox's current historyId as a baseline (no
 * backfill — Donna starts from "now"). Subsequent runs walk
 * history.list from the stored cursor; new inbox messages become sources
 * and go through the extraction pipeline.
 */

const MAX_MESSAGES_PER_SYNC = 10;

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
}

export async function syncGmailForUser(
  userId: string
): Promise<{ ok: boolean; new_messages: number; baselined?: boolean; error?: string }> {
  const tokenResult = await getGoogleAccessToken(userId);
  if (!tokenResult.ok) return { ok: false, new_messages: 0, error: "not_connected" };
  const token = tokenResult.token;

  const db = createAdminClient();
  const { data: conn } = await db
    .from("google_connections")
    .select("id, last_history_id")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();
  if (!conn) return { ok: false, new_messages: 0, error: "not_connected" };

  const authHeaders = { authorization: `Bearer ${token}` };

  // First sync: record the current cursor and stop — no backfill.
  if (!conn.last_history_id) {
    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      { headers: authHeaders }
    );
    if (!res.ok) return { ok: false, new_messages: 0, error: `profile ${res.status}` };
    const profile = await res.json();
    await db
      .from("google_connections")
      .update({
        last_history_id: String(profile.historyId),
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", conn.id);
    return { ok: true, new_messages: 0, baselined: true };
  }

  // Incremental: everything added to INBOX since the cursor.
  const historyUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/history");
  historyUrl.searchParams.set("startHistoryId", conn.last_history_id);
  historyUrl.searchParams.set("historyTypes", "messageAdded");
  historyUrl.searchParams.set("labelId", "INBOX");
  const historyRes = await fetch(historyUrl, { headers: authHeaders });
  if (historyRes.status === 404) {
    // Cursor too old — Gmail expired it. Re-baseline rather than fail forever.
    await db
      .from("google_connections")
      .update({ last_history_id: null })
      .eq("id", conn.id);
    return syncGmailForUser(userId);
  }
  if (!historyRes.ok) {
    return { ok: false, new_messages: 0, error: `history ${historyRes.status}` };
  }
  const history = await historyRes.json();

  const messageIds: string[] = [];
  for (const h of history.history ?? []) {
    for (const added of h.messagesAdded ?? []) {
      const id = added.message?.id;
      if (id && !messageIds.includes(id)) messageIds.push(id);
    }
  }

  let newCount = 0;
  for (const messageId of messageIds.slice(0, MAX_MESSAGES_PER_SYNC)) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      { headers: authHeaders }
    );
    if (!msgRes.ok) continue;
    const msg = await msgRes.json();

    // Skip things the owner sent themselves
    if ((msg.labelIds ?? []).includes("SENT")) continue;

    const headers: GmailHeader[] = msg.payload?.headers ?? [];
    const header = (name: string) =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

    const { data: source, error } = await db
      .from("sources")
      .upsert(
        {
          user_id: userId,
          kind: "email",
          title: header("Subject") || "(no subject)",
          raw: {
            from: header("From"),
            to: header("To"),
            date: header("Date"),
            subject: header("Subject"),
            snippet: msg.snippet ?? "",
            body: extractPlainText(msg.payload).slice(0, 50_000),
          },
          external_id: messageId,
          occurred_at: msg.internalDate
            ? new Date(Number(msg.internalDate)).toISOString()
            : new Date().toISOString(),
          processed: false,
        },
        { onConflict: "user_id,kind,external_id", ignoreDuplicates: true }
      )
      .select("id")
      .maybeSingle();
    if (error || !source) continue; // duplicate → already processed earlier

    newCount++;
    try {
      await processSource(userId, source.id);
    } catch (err) {
      console.error(`gmail pipeline failed for ${messageId}:`, err);
    }
  }

  await db
    .from("google_connections")
    .update({
      last_history_id: String(history.historyId ?? conn.last_history_id),
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", conn.id);

  return { ok: true, new_messages: newCount };
}

function extractPlainText(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) {
    return Buffer.from(part.body.data, "base64url").toString("utf8");
  }
  for (const child of part.parts ?? []) {
    const text = extractPlainText(child);
    if (text) return text;
  }
  return "";
}

/**
 * ===== Recall.ai transcript retrieval =====
 *
 * The `transcript.done` webhook only carries a transcript *id* — not the
 * words. To get the actual conversation we:
 *   1. GET /api/v1/transcript/{id}/            → { data: { download_url } }
 *   2. GET download_url (presigned, no auth)   → array of diarized segments
 *   3. flatten to "Speaker: text" prose for the extraction model
 *
 * Region matters: Recall API keys are region-scoped, so the base URL must
 * match the dashboard region (same env var the bot-schedule route uses).
 */

const RECALL_BASE = `https://${process.env.RECALL_REGION ?? "us-west-2"}.recall.ai/api/v1`;

interface TranscriptWord {
  text: string;
}
interface TranscriptSegment {
  participant?: { id?: number; name?: string | null; email?: string | null } | null;
  words?: TranscriptWord[];
}

export interface FetchedTranscript {
  text: string;
  participants: Array<{ name: string; email: string | null }>;
}

/**
 * Fetches and flattens a finished transcript. Returns null when the
 * transcript can't be retrieved yet (caller should leave the source
 * unprocessed so it can be retried).
 */
export async function fetchRecallTranscript(
  transcriptId: string
): Promise<FetchedTranscript | null> {
  const apiKey = process.env.RECALL_API_KEY;
  if (!apiKey) return null;

  const metaRes = await fetch(`${RECALL_BASE}/transcript/${transcriptId}/`, {
    headers: { authorization: `Token ${apiKey}`, accept: "application/json" },
  });
  if (!metaRes.ok) return null;
  const meta = await metaRes.json();

  const downloadUrl: string | undefined = meta?.data?.download_url;
  if (!downloadUrl) return null;

  // The download URL is presigned — no auth header (and adding one can 403).
  const dataRes = await fetch(downloadUrl);
  if (!dataRes.ok) return null;
  const segments: TranscriptSegment[] = await dataRes.json();
  if (!Array.isArray(segments)) return null;

  const lines: string[] = [];
  const seen = new Map<string, { name: string; email: string | null }>();
  for (const seg of segments) {
    const name = seg.participant?.name?.trim() || "Speaker";
    const email = seg.participant?.email ?? null;
    const key = email ?? name;
    if (!seen.has(key)) seen.set(key, { name, email });
    const text = (seg.words ?? []).map((w) => w.text).join(" ").trim();
    if (text) lines.push(`${name}: ${text}`);
  }

  return { text: lines.join("\n"), participants: [...seen.values()] };
}

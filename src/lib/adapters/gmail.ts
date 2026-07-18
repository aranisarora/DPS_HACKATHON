import { withRetry, isDemoMode, type AdapterResult } from "./index";

export interface SendEmailParams {
  to: string[];
  subject: string;
  body: string; // plain text
  cc?: string[];
}

/**
 * Gmail adapter — draft-then-send to eliminate double-send risk.
 *
 * messages.send has NO idempotency: retrying after a lost response re-sends
 * real email. Instead we:
 *   1. Create a draft (retry-safe — worst case is an orphaned draft, visible
 *      in the user's Drafts folder).
 *   2. Send the draft exactly ONCE, no retry. If the send call fails
 *      ambiguously (network error after dispatch), we fail with a message
 *      telling the user to check their Sent folder before retrying.
 */
export async function sendEmail(
  accessToken: string | null,
  params: SendEmailParams,
  idempotencyKey: string
): Promise<AdapterResult> {
  // Demo mode only via explicit flag / unconfigured OAuth app. A missing user
  // token is handled upstream by the executor (fail closed) — never here.
  if (isDemoMode("google")) {
    return {
      ok: true,
      demo: true,
      external_id: `demo-mail-${idempotencyKey.slice(0, 8)}`,
      detail: `[demo] Would send "${params.subject}" to ${params.to.join(", ")}`,
    };
  }

  if (!accessToken) {
    return { ok: false, demo: false, error: "No Google access token (executor should have failed closed)" };
  }

  const raw = buildMime(params);
  const headers = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
  };

  // Step 1 — create draft (retryable)
  let draftId: string;
  try {
    const draft = await withRetry(async () => {
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: { raw } }),
      });
      if (!res.ok) throw new Error(`Gmail drafts API ${res.status}: ${await res.text()}`);
      return res.json();
    });
    draftId = draft.id;
  } catch (err) {
    return { ok: false, demo: false, error: `Couldn't create Gmail draft: ${String(err)}` };
  }

  // Step 2 — send the draft exactly once, NO retry
  let res: Response;
  try {
    res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts/send", {
      method: "POST",
      headers,
      body: JSON.stringify({ id: draftId }),
    });
  } catch (err) {
    // Ambiguous: the request may have reached Gmail before the failure.
    return {
      ok: false,
      demo: false,
      error: "Send may have gone through — check your Sent folder before retrying",
      detail: `draft_id=${draftId}; ${String(err)}`,
    };
  }

  if (!res.ok) {
    // Unambiguous failure — the draft still exists in Drafts.
    return {
      ok: false,
      demo: false,
      error: `Gmail send API ${res.status}: ${await res.text()}`,
      detail: `draft_id=${draftId} (still in Drafts)`,
    };
  }

  const sent = await res.json();
  return { ok: true, demo: false, external_id: sent.id ?? sent.message?.id };
}

/**
 * RFC 2047 encoded-word for header values: plain ASCII passes through,
 * anything else becomes =?UTF-8?B?<base64>?=. Exported for tests.
 */
export function encodeMimeSubject(subject: string): string {
  if (!/[^\x20-\x7E]/.test(subject)) return subject;
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

function buildMime(p: SendEmailParams): string {
  const lines = [
    `To: ${p.to.join(", ")}`,
    p.cc?.length ? `Cc: ${p.cc.join(", ")}` : null,
    `Subject: ${encodeMimeSubject(p.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(p.body, "utf8").toString("base64"),
  ].filter((l): l is string => l !== null);
  return Buffer.from(lines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

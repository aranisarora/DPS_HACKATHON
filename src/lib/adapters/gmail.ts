import { withRetry, isDemoMode, type AdapterResult } from "./index";

export interface SendEmailParams {
  to: string[];
  subject: string;
  body: string; // plain text
  cc?: string[];
}

export async function sendEmail(
  accessToken: string | null,
  params: SendEmailParams,
  idempotencyKey: string
): Promise<AdapterResult> {
  if (isDemoMode("google") || !accessToken) {
    return {
      ok: true,
      demo: true,
      external_id: `demo-mail-${idempotencyKey.slice(0, 8)}`,
      detail: `[demo] Would send "${params.subject}" to ${params.to.join(", ")}`,
    };
  }

  try {
    const raw = buildMime(params);
    const result = await withRetry(async () => {
      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ raw }),
        }
      );
      if (!res.ok) throw new Error(`Gmail API ${res.status}: ${await res.text()}`);
      return res.json();
    });
    return { ok: true, demo: false, external_id: result.id };
  } catch (err) {
    return { ok: false, demo: false, error: String(err) };
  }
}

function buildMime(p: SendEmailParams): string {
  const lines = [
    `To: ${p.to.join(", ")}`,
    p.cc?.length ? `Cc: ${p.cc.join(", ")}` : null,
    `Subject: ${p.subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    p.body,
  ].filter((l): l is string => l !== null);
  return Buffer.from(lines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

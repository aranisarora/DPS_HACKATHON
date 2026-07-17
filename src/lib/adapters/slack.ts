import { withRetry, isDemoMode, type AdapterResult } from "./index";

export interface SlackMessageParams {
  channel: string; // channel id or user id for DM
  text: string;
}

export async function postSlackMessage(
  params: SlackMessageParams,
  idempotencyKey: string
): Promise<AdapterResult> {
  if (isDemoMode("slack")) {
    return {
      ok: true,
      demo: true,
      external_id: `demo-slack-${idempotencyKey.slice(0, 8)}`,
      detail: `[demo] Would post to ${params.channel}: "${params.text.slice(0, 80)}…"`,
    };
  }

  try {
    const result = await withRetry(async () => {
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ channel: params.channel, text: params.text }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(`Slack API: ${data.error}`);
      return data;
    });
    return { ok: true, demo: false, external_id: result.ts };
  } catch (err) {
    return { ok: false, demo: false, error: String(err) };
  }
}

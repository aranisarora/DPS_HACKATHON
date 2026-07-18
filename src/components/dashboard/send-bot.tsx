"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * "Send Donna to a meeting" — paste a meeting link, Donna's notetaker bot
 * joins the call. The transcript flows back through /api/ingest/recall and
 * proposals appear in the inbox when the meeting ends.
 */
export function SendBot({ onSent }: { onSent?: () => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  const send = useCallback(async () => {
    if (!url.trim() || sending) return;
    setSending(true);
    setNote(null);
    const res = await fetch("/api/bots/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ meeting_url: url }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok) {
      setUrl("");
      setNote({
        text: data.demo
          ? "Recall not configured yet — bot simulated"
          : "Donna is on her way to the meeting",
        ok: true,
      });
      onSent?.();
    } else {
      setNote({ text: data.error ?? "Couldn't send the bot — try again", ok: false });
    }
    setSending(false);
  }, [url, sending, onSent]);

  return (
    <div className="mt-6 w-full max-w-[280px]">
      {!open ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-sage/40 text-sage hover:border-brass hover:text-brass"
          onClick={() => setOpen(true)}
        >
          Send Donna to a meeting
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-2"
          >
            <input
              type="url"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Paste a Zoom / Meet / Teams link"
              className="w-full rounded-memo border border-desk-line bg-desk-raised px-3 py-2 text-sm text-paper placeholder:text-sage/60 focus:outline-none focus:ring-2 focus:ring-brass/60"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={send} disabled={sending || !url.trim()}>
                {sending ? "Sending…" : "Send Donna"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-sage hover:bg-paper/5 hover:text-paper"
                onClick={() => {
                  setOpen(false);
                  setNote(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      {note && (
        <p className={`mt-2 text-xs ${note.ok ? "text-sage" : "text-pencil"}`}>
          {note.text}
        </p>
      )}
    </div>
  );
}

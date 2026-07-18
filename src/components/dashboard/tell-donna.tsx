"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

/**
 * "Tell Donna" — free text through the full LLM pipeline. "Remind John to
 * send the invoice Friday" becomes proposed actions in the inbox, exactly as
 * if it had been said in a meeting.
 */
export function TellDonna({ onIngested }: { onIngested?: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  const submit = useCallback(async () => {
    if (text.trim().length < 3 || sending) return;
    setSending(true);
    setNote(null);
    const res = await fetch("/api/ingest/manual", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: text.trim(),
        // Lets Donna resolve "tomorrow at 3" in the owner's local time
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok) {
      setText("");
      setNote({
        text:
          data.created > 0
            ? `Got it — ${data.created} action${data.created === 1 ? "" : "s"} proposed`
            : "Got it — nothing actionable found",
        ok: true,
      });
      onIngested?.();
    } else {
      setNote({ text: data.error ?? "Donna couldn't process that — try again", ok: false });
    }
    setSending(false);
  }, [text, sending, onIngested]);

  return (
    <div className="mt-3 w-full max-w-[280px]">
      {!open ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-sage/40 text-sage hover:border-brass hover:text-brass"
          onClick={() => setOpen(true)}
        >
          Tell Donna
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-2"
          >
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
              placeholder='e.g. "Remind John to send the invoice Friday"'
              rows={3}
              maxLength={10000}
              className="w-full rounded-memo border border-desk-line bg-desk-raised px-3 py-2 text-sm text-paper placeholder:text-sage/60 focus:outline-none focus:ring-2 focus:ring-brass/60"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={submit}
                disabled={sending || text.trim().length < 3}
              >
                {sending ? "Thinking…" : "Tell Donna"}
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

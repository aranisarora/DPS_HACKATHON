"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Orb } from "@/components/orb/orb";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const QUESTIONS = [
  {
    key: "what_you_do",
    q: "What does your business do?",
    placeholder: "e.g. We're a 6-person creative agency doing brand campaigns for DTC brands…",
  },
  {
    key: "who_your_clients_are",
    q: "Who are your clients?",
    placeholder: "e.g. DTC skincare and food brands — Aurelia, Fern & Co, Marlow Coffee…",
  },
  {
    key: "tone_of_voice",
    q: "How do you sound in writing?",
    placeholder: "e.g. Warm, direct, no fluff. First names. Short sentences.",
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const current = QUESTIONS[step];
  const value = answers[current?.key ?? ""] ?? "";

  async function next() {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("business_profile").upsert(
        { user_id: user.id, version: 1, questionnaire: answers, confirmed: true },
        { onConflict: "user_id,version" }
      );
      await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
    }
    router.push("/app");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Orb size={180} mood={saving ? "executing" : "idle"} />
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs uppercase tracking-[0.28em] text-brass">
          Her first briefing · {step + 1} of {QUESTIONS.length}
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="mt-3 text-center font-display text-3xl font-medium tracking-tight">
              {current.q}
            </h1>
            <textarea
              autoFocus
              rows={4}
              value={value}
              placeholder={current.placeholder}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, [current.key]: e.target.value }))
              }
              className="paper-surface mt-6 w-full rounded-memo p-5 text-sm leading-relaxed text-ink shadow-memo placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-brass/60"
            />
          </motion.div>
        </AnimatePresence>
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-sage hover:bg-paper/5 hover:text-paper"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || saving}
          >
            Back
          </Button>
          <Button onClick={next} disabled={value.trim().length < 3 || saving}>
            {saving
              ? "Setting up…"
              : step === QUESTIONS.length - 1
                ? "Meet your inbox"
                : "Continue"}
          </Button>
        </div>
      </div>
    </main>
  );
}

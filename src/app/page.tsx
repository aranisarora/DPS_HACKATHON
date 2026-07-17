import Link from "next/link";
import { Orb } from "@/components/orb/orb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STEPS = [
  {
    n: "01",
    title: "Donna listens",
    body: "She joins your online meetings (announcing herself) and reads your inbox — the two places busywork is born.",
  },
  {
    n: "02",
    title: "She does the work",
    body: "Follow-ups get booked, recaps get written, tasks get assigned to the right teammate — drafted in your voice.",
  },
  {
    n: "03",
    title: "You tap approve",
    body: "Nothing leaves your workspace without your OK. One tap and it's done — and she earns more autonomy as you trust her.",
  },
];

const ACTIONS = [
  ["Recap email drafted & sent", "15 min"],
  ["Follow-up found & booked", "10 min"],
  ["Task assigned & teammate notified", "5 min"],
  ["Absent teammate briefed", "10 min"],
  ["Decisions posted to Slack", "5 min"],
  ["Daily brief compiled", "10 min"],
] as const;

export default function Landing() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl font-medium tracking-tight">Donna</span>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/login">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-12 pb-24 md:grid-cols-2">
        <div className="animate-fade-up">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Your AI admin assistant
          </p>
          <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
            The meeting ends.
            <br />
            <span className="text-iridescent">The work is done.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
            Donna turns the busywork from your meetings and inbox into finished
            tasks — booking the follow-ups, writing the recaps, assigning the
            work — with a single tap of your approval.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/login">
              <Button size="lg">Start with Google</Button>
            </Link>
            <span className="text-sm text-ink-soft">Set up in under 5 minutes</span>
          </div>
          <p className="mt-10 font-display text-xl text-ink">
            Owners save an estimated{" "}
            <span className="text-iridescent font-semibold">4h 20m a week</span>{" "}
            on admin.
          </p>
        </div>
        <div className="relative flex justify-center">
          <div
            aria-hidden
            className="absolute inset-0 m-auto h-[480px] w-[480px] rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 40% 35%, rgba(124,106,234,0.35), rgba(94,139,238,0.18) 45%, rgba(62,198,192,0.12) 70%, transparent 75%)",
            }}
          />
          <Orb size={360} />
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-ink/[0.06] bg-white/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
            Not another notetaker.
            <span className="block text-ink-soft">The last mile — actually done.</span>
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <Card key={s.n} className="p-8">
                <span className="font-display text-sm text-accent">{s.n}</span>
                <h3 className="mt-2 font-display text-xl font-medium">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Time saved */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
                Every action shows you
                <br />
                <span className="text-iridescent">the minutes it gave back.</span>
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
                Donna keeps score honestly. Each recap, booking and assignment
                carries an estimated time saved — summed into a counter that is
                the first thing you see every morning.
              </p>
            </div>
            <Card className="divide-y divide-ink/[0.06] p-2">
              {ACTIONS.map(([label, mins]) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm">{label}</span>
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                    +{mins}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-ink/[0.06] bg-ink py-24 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
            Trust first. Autonomy earned.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-white/70">
            Donna never sends anything external without your approval. She acts
            alone only on the safe stuff — your own calendar, internal tasks —
            and only earns more autonomy as you approve her work. Deterministic
            code, not the AI, makes every final fire decision.
          </p>
          <div className="mt-10">
            <Link href="/login">
              <Button size="lg">Meet Donna</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 py-10 text-xs text-ink-soft">
        <span className="font-display text-base text-ink">Donna</span>
        <span>Donna announces herself in meetings · Your data stays yours</span>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { Orb } from "@/components/orb/orb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stamp } from "@/components/ui/stamp";
import { Artwork } from "@/components/ui/artwork";

/* The pipeline, told as a paper trail: every memo moves through three stamps. */
const MEMOS = [
  {
    stamp: "Received",
    color: "ink" as const,
    title: "She sits in",
    body: "Donna joins your online meetings (announcing herself) and reads your inbox — the two places busywork is born.",
  },
  {
    stamp: "Drafted",
    color: "brass" as const,
    title: "She does the work",
    body: "Follow-ups get booked, recaps get written, tasks get assigned to the right teammate — drafted in your voice.",
  },
  {
    stamp: "Approved",
    color: "pencil" as const,
    title: "You stamp it",
    body: "Nothing leaves your workspace without your OK. One tap and it's done — and she earns more autonomy as you trust her.",
  },
];

const LEDGER = [
  ["Recap email drafted & sent", 15],
  ["Follow-up found & booked", 10],
  ["Task assigned & teammate notified", 5],
  ["Absent teammate briefed", 10],
  ["Decisions posted to Slack", 5],
  ["Daily brief compiled", 10],
] as const;

const LEDGER_TOTAL = LEDGER.reduce((s, [, m]) => s + m, 0);

export default function Landing() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl italic tracking-tight text-brass">Donna</span>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-sage hover:bg-paper/5 hover:text-paper"
            >
              Sign in
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-12 pb-24 md:grid-cols-2">
        <div className="animate-fade-up">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.28em] text-brass">
            Memo · to every founder drowning in admin
          </p>
          <h1 className="font-display text-5xl font-medium leading-[1.08] tracking-tight md:text-6xl">
            The meeting ends.
            <br />
            <span className="italic text-brass-bright">The work is done.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-sage">
            Donna turns the busywork from your meetings and inbox into finished
            tasks — booking the follow-ups, writing the recaps, assigning the
            work — with a single tap of your approval.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/login">
              <Button size="lg">Start with Google</Button>
            </Link>
            <span className="text-sm text-sage">Set up in under 5 minutes</span>
          </div>
          <p className="mt-10 font-display text-xl">
            Owners save an estimated{" "}
            <span className="font-mono text-lg text-brass-bright">4h 20m</span> a week
            on admin.
          </p>
        </div>

        {/* Her desk — generated still life behind the brass sphere */}
        <div className="relative flex items-center justify-center">
          <Artwork
            src="/images/hero-desk.jpg"
            alt="An executive assistant's desk at dusk — brass lamp, ivory memos, fountain pen"
            className="absolute inset-0 rounded-memo"
            imgClassName="opacity-80 [mask-image:radial-gradient(ellipse_75%_75%_at_center,#000_55%,transparent_100%)]"
            fallback={
              <div
                aria-hidden
                className="absolute inset-0 m-auto h-[440px] w-[440px] rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle at 45% 38%, rgba(230,200,127,0.22), rgba(194,162,91,0.1) 50%, transparent 72%)",
                }}
              />
            }
          />
          <Orb size={360} />
        </div>
      </section>

      {/* The paper trail */}
      <section className="border-y border-desk-line bg-desk-raised py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-brass">
            The paper trail
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
            Not another notetaker.
            <span className="block italic text-sage">The last mile — actually done.</span>
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {MEMOS.map((m, i) => (
              <Card
                key={m.stamp}
                className={`paper-ruled p-8 transition-transform duration-300 hover:-translate-y-1 hover:shadow-memo-lift ${
                  i === 0 ? "md:-rotate-1" : i === 2 ? "md:rotate-1" : ""
                }`}
              >
                <Stamp color={m.color}>{m.stamp}</Stamp>
                <h3 className="mt-4 font-display text-xl font-medium">{m.title}</h3>
                <p className="mt-3 text-sm leading-[28px] text-ink-soft">{m.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* The ledger */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-brass">
                The ledger
              </p>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
                Every action is
                <br />
                <span className="italic text-brass-bright">entered in the book.</span>
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-sage">
                Donna keeps score honestly. Each recap, booking and assignment
                carries an estimated time saved — summed into a running total
                that is the first thing you see every morning.
              </p>
            </div>
            <Card className="p-8">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
                  A typical week
                </span>
                <span className="font-mono text-xs text-ink-soft">min</span>
              </div>
              <div className="mt-4 divide-y divide-paper-line">
                {LEDGER.map(([label, mins]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="text-sm">{label}</span>
                    <span className="font-mono text-sm text-brass-deep">{mins}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1 flex items-baseline justify-between border-t-2 border-ink pt-3">
                <span className="font-display text-base italic">Returned to you</span>
                <span className="font-mono text-base font-medium">
                  {Math.floor(LEDGER_TOTAL / 60)}h {LEDGER_TOTAL % 60}m
                </span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="letterhead-rule mx-auto mb-14 w-2/3" />
          <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
            Trust first. <span className="italic text-brass-bright">Autonomy earned.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-sage">
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
          <div className="letterhead-rule mx-auto mt-14 w-2/3" />
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-10 text-xs text-sage sm:flex-row">
        <span className="font-display text-base italic text-brass">Donna</span>
        <span className="font-mono tracking-wider">
          She announces herself in meetings · Your data stays yours
        </span>
      </footer>
    </main>
  );
}

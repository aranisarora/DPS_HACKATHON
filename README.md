# Donna

**An AI admin assistant for service businesses.** Donna turns the busywork from
your meetings and inbox into finished tasks — booking the follow-ups, writing
the recaps, assigning the work — with a single tap of your approval. And she
shows you exactly how much time she gave back.

> The demo storyline: a 20-minute client meeting becomes a booked follow-up, a
> recap email to the client, a task assigned to a designer, and an update to the
> absent account manager — all approved in three taps, with the counter ticking
> up "47 minutes saved."

## Stack

- **Next.js 15** (App Router) · TypeScript · Tailwind · Framer Motion
- **React Three Fiber + drei** — the orb (3D is ambiance, never navigation)
- **Supabase** — Google OAuth, Postgres + RLS, the audit trail
- **Fable 5** — extraction & drafting (never the fire decision)
- **Recall.ai** — meeting capture · **Google Workspace APIs** · **Slack**
- **Sentry** + **PostHog** — observability & product analytics
- **Vercel** — hosting

## The autonomy engine (the IP)

`src/lib/autonomy/router.ts` — a deterministic three-tier gate:

| Tier | When | Examples |
|---|---|---|
| **Auto** | internal + reversible + high confidence | own-calendar blocks, internal tasks |
| **Draft & approve** | anything leaving your workspace | client recaps, invites, DMs |
| **Suggest** | low confidence / no integration | money, hires, fragile relationships |

Importance never increases autonomy — urgency affects ordering only. The model
proposes confidence/risk; deterministic code owns fire/don't-fire. 14 unit
tests (`npm test`) pin every tier rule.

## Getting started

See **[SETUP.md](./SETUP.md)** for the complete provisioning guide (what's done,
what needs your keys).

```bash
npm install
npm run dev
```

Sign in → dashboard → **"Load demo meeting"** to see the full loop with zero
external keys (adapters simulate in demo mode, marked in the audit log).

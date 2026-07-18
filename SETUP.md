# Donna — Setup Guide

Everything already provisioned, and every step you still need to do yourself.

---

## ✅ Already done (by Claude, via MCP)

| Thing | Where | Status |
|---|---|---|
| Supabase project **Donna** | `mctuxlttefxeyvmljytz` · eu-west-2 (London) | ✅ created |
| Full schema + RLS on every table | migrations `donna_core_schema`, `security_hardening` | ✅ applied |
| Next.js 15 app (TS, Tailwind, R3F orb, Framer Motion) | this repo | ✅ built |
| Autonomy router + 14 unit tests | `src/lib/autonomy/` | ✅ passing |
| Token encryption key | `.env.local` `TOKEN_ENCRYPTION_KEY` | ✅ generated |
| Vercel project **donna** (production) | https://donna-aranis-aroras-projects.vercel.app | ✅ deployed |

---

https://donna-jet.vercel.app


## 🔧 Steps you must do (in order)

### 1. Supabase service role key (2 min) — required for approve/execute
1. Open https://supabase.com/dashboard/project/mctuxlttefxeyvmljytz/settings/api
2. Copy the **service_role** key
3. Paste into `.env.local` → `SUPABASE_SERVICE_ROLE_KEY=`
4. Also add it in Vercel → [donna → Settings → Environment Variables](https://vercel.com/aranis-aroras-projects/donna/settings/environment-variables), along with `TOKEN_ENCRYPTION_KEY` (copy from `.env.local`), then redeploy

### 2. Anthropic API key (2 min) — required for live extraction
1. https://console.anthropic.com/ → API keys → create key
2. `.env.local` → `ANTHROPIC_API_KEY=`
   (The seeded demo works without this — extraction of *new* meetings/emails needs it.)

### 3. Google OAuth (15 min) — required for sign-in
1. https://console.cloud.google.com/ → create project **Donna**
2. **APIs & Services → OAuth consent screen**: External, app name "Donna", add scopes:
   - `.../auth/userinfo.email`, `.../auth/userinfo.profile`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/tasks`
   - Add yourself as a **test user** (unverified apps cap at 100 test users — start verification early for public launch)
3. **Credentials → Create OAuth client ID → Web application**:
   - Authorized redirect URI: `https://mctuxlttefxeyvmljytz.supabase.co/auth/v1/callback`
4. **Enable APIs**: Google Calendar API, Gmail API, Google Tasks API (APIs & Services → Library)
5. Supabase: https://supabase.com/dashboard/project/mctuxlttefxeyvmljytz/auth/providers
   → Google → enable → paste Client ID + Secret
6. Put the same Client ID/Secret in `.env.local` (`GOOGLE_CLIENT_ID/SECRET`)
7. Supabase → Auth → URL Configuration → set **Site URL** to your Vercel URL and add
   `http://localhost:3000/**` + `https://<your-vercel-domain>/**` to Redirect URLs

### 4. Recall.ai (10 min) — live meeting capture
1. https://recall.ai → sign up (free starter credits; ~$0.50/recording-hour after)
2. Dashboard → API key → `.env.local` → `RECALL_API_KEY=`
3. Webhooks → add endpoint: `https://<your-vercel-domain>/api/ingest/recall`
4. Copy the webhook signing secret → `RECALL_WEBHOOK_SECRET=`
   (The webhook route verifies svix signatures; unsigned calls are rejected.)

### 5. Slack (5 min, optional — cut first if time runs short)
1. https://api.slack.com/apps → Create app → from scratch
2. OAuth & Permissions → Bot scopes: `chat:write`, `users:read`, `im:write`
3. Install to workspace → copy **Bot User OAuth Token** (`xoxb-…`) → `SLACK_BOT_TOKEN=`

### 6. Cron secret (1 min) — required for the daily Gmail sync
1. `openssl rand -hex 32` → `.env.local` → `CRON_SECRET=`
2. Add the same value in Vercel env vars (the `vercel.json` cron calls
   `GET /api/sync/gmail` with `Authorization: Bearer $CRON_SECRET`; an empty
   secret means the cron 401s forever)

---

## 🚀 Local dev

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 14 autonomy-router gate tests
npm run build      # production build
```

**Demo without any external keys:** sign in (after step 3), open the dashboard, click **"Load demo meeting"**. The seeded transcript uses Recall's exact JSON schema and flows through the same router/executor code as a live meeting; adapters run in demo mode (simulate success, marked `demo` in the audit log) when `DONNA_DEMO=1` is set **or** the Google OAuth keys are absent.

**Fail-closed rule:** once `GOOGLE_CLIENT_ID/SECRET` are configured, a missing or revoked *user* connection is **not** demo — approved actions fail with a clear error and the dashboard/settings show a **Reconnect Google** button. There is no silent fallback that pretends an email was sent.

---

## 🔒 Production-ready checklist (state of play)

- **RLS on every table** — `google_connections` deliberately has *no* client policies (tokens are service-role only)
- **Tokens encrypted at rest** — AES-256-GCM, key in env only
- **Webhook signature verification** — Recall/svix HMAC, timing-safe compare
- **Idempotent executors** — unique `idempotency_key` per action; status-guarded claim prevents double-fires; retries with backoff
- **The fire gate** — single deterministic module (`src/lib/autonomy/router.ts`), 14 unit tests; model output is input, never decision
- **Prompt-injection defence** — source content wrapped as data; system prompt refuses imperative content in transcripts/emails
- **Observability** — audit_log as user-facing proof
- **LLM hygiene** — Zod-validated JSON, reject/retry malformed extractions
- **Performance** — orb lazy-loaded (`ssr:false`), DPR capped, low-power GL, CSS fallback
- **Compliance** — bot named "Donna" announces itself; write your data-retention policy before public launch

## Data model
`profiles · google_connections · contacts · business_profile · sources · proposed_actions (minutes_saved) · tasks (assignment source of truth) · audit_log`

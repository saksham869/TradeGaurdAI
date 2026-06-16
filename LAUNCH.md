# TradeGuard AI — Launch Checklist (v1.0.0)

Public India launch target: **30 June 2026**

---

## 1. Environment Variables

### Required — App will not start without these

| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | Neon DB | `postgres://...?sslmode=require` |
| `DIRECT_URL` | Neon DB | Direct connection (no pgBouncer) for Prisma migrations |
| `UPSTASH_REDIS_REST_URL` | Upstash | Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | Redis REST auth token |

### Required — Auth (Clerk)

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_…` for production |
| `CLERK_SECRET_KEY` | `sk_live_…` for production |
| `CLERK_WEBHOOK_SECRET` | From Clerk dashboard → Webhooks |

### Required — Primary AI (Azure OpenAI)

| Variable | Notes |
|---|---|
| `AZURE_OPENAI_ENDPOINT` | `https://<resource>.openai.azure.com/` |
| `AZURE_OPENAI_API_KEY` | Resource key |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Deployed model name (e.g. `gpt-4o`) |

### Optional — Fallback AI (GitHub Models, free tier)

| Variable | Notes |
|---|---|
| `GITHUB_TOKEN` | PAT with `models:read` scope |
| `GITHUB_MODEL` | Default: `openai/gpt-4o` |

### Optional — Specialised AI

| Variable | When used |
|---|---|
| `ANTHROPIC_API_KEY` | Journal reflection + synthesis (Claude Sonnet) |
| `XAI_API_KEY` | Social hype detection (Grok) |
| `PERPLEXITY_API_KEY` | News research with citations |

### Optional — Azure Safety & Knowledge

| Variable | Notes |
|---|---|
| `AZURE_CONTENT_SAFETY_ENDPOINT` | Content Safety API |
| `AZURE_CONTENT_SAFETY_KEY` | |
| `AZURE_FOUNDRY_ENDPOINT` | Azure AI Foundry for Research Terminal IQ |
| `AZURE_FOUNDRY_KEY` | |
| `AZURE_KNOWLEDGE_BASE_NAME` | Azure AI Search index |
| `AZURE_SEARCH_ENDPOINT` | Azure Cognitive Search |
| `AZURE_SEARCH_KEY` | |
| `AZURE_SEARCH_INDEX` | Index name |

### Required — Payments (Razorpay)

| Variable | Notes |
|---|---|
| `RAZORPAY_KEY_ID` | Live key: `rzp_live_…` |
| `RAZORPAY_KEY_SECRET` | |
| `RAZORPAY_PLAN_ID` | PRO plan ID (`plan_…`) |
| `RAZORPAY_WEBHOOK_SECRET` | From Razorpay → Webhooks |

### Required — Real-time (Pusher)

| Variable | Notes |
|---|---|
| `PUSHER_APP_ID` | |
| `PUSHER_KEY` | |
| `PUSHER_SECRET` | |
| `PUSHER_CLUSTER` | e.g. `ap2` |
| `NEXT_PUBLIC_PUSHER_KEY` | Same as `PUSHER_KEY` (client-side) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Same as `PUSHER_CLUSTER` (client-side) |

### Optional — Budget & Safety

| Variable | Default | Notes |
|---|---|---|
| `AI_DAILY_CALL_BUDGET` | `5000` | LLM calls/day before degraded mode |
| `CRON_SECRET` | — | Protects `/api/cron/*` endpoints |
| `ALLOW_PROTOTYPE_USER` | `false` | Dev-only: bypass Clerk auth |

---

## 2. Database Setup

```bash
# 1. Push schema to Neon (production — no destructive migrations)
pnpm prisma db push

# 2. Seed India demo user + sample data
pnpm seed

# 3. Optional: seed financial symbol index
pnpm seed:index
```

---

## 3. Build + Smoke Verification

```bash
# Full production build — must exit 0
pnpm build

# Unit tests — must exit 0 (11 tests: EMA, RSI, VWAP)
pnpm test

# E2E smoke against local dev server
pnpm dev &
sleep 5
pnpm smoke

# E2E smoke against production
BASE_URL=https://tradeguard.app pnpm smoke
```

---

## 4. Vercel Deployment

1. Connect repo to Vercel project
2. Set Framework Preset: **Next.js**
3. Build Command: `pnpm build` (already includes `prisma generate`)
4. Install Command: `pnpm install`
5. Add all env vars from Section 1 in Vercel → Settings → Environment Variables
6. Ensure Vercel plan supports **cron jobs** (Hobby: max 2 crons; Pro: unlimited)
   - Current crons in `vercel.json`: 4 daily jobs (morning-brief, news-ingestion, trending-scan, cleanup)
   - Hobby plan: consolidate to 2 if needed, or upgrade to Pro

### Vercel Cron Schedule (vercel.json)

```
morning-brief   0 9  * * 1-5  — 09:00 UTC Mon-Fri (14:30 IST)
news-ingestion  0 10 * * 1-5  — 10:00 UTC Mon-Fri (15:30 IST, NSE close)
trending-scan   0 12 * * *    — 12:00 UTC daily
cleanup         0 2  * * *    — 02:00 UTC daily
```

---

## 5. Clerk Configuration

- [ ] Create production Clerk application
- [ ] Set Allowed Origins: `https://tradeguard.app`
- [ ] Create webhook endpoint: `https://tradeguard.app/api/webhooks/clerk`
  - Events: `user.created`, `user.updated`, `user.deleted`
- [ ] Copy webhook secret to `CLERK_WEBHOOK_SECRET`

---

## 6. Razorpay Configuration

- [ ] Create live Razorpay account with KYC completed
- [ ] Create subscription plan (₹499/month) → copy Plan ID to `RAZORPAY_PLAN_ID`
- [ ] Create webhook: `https://tradeguard.app/api/webhooks/razorpay`
  - Events: `subscription.activated`, `subscription.cancelled`, `subscription.halted`
- [ ] Copy webhook secret to `RAZORPAY_WEBHOOK_SECRET`
- [ ] Test payment flow end-to-end with test keys before go-live

---

## 7. Pre-Launch Checks

### Honesty labels
- [ ] Every AI panel labels the actual model used (never hardcoded)
- [ ] Statistics show sample size: `58% (n=31)` format
- [ ] TraderModel gate shows **CALIBRATING** when <20 trades or <10 journals
- [ ] Approximated indicators labeled `(approx)` when bar data unavailable
- [ ] Disclaimer visible on every analysis surface: *"This is not financial advice"*
- [ ] App never places trades automatically

### Plan gating
- [ ] FREE: max 5 watchlist symbols
- [ ] FREE: max 5 research queries/day
- [ ] FREE: no copilot access (402 with upgrade CTA)
- [ ] FREE + PRO: max 10 journal entries/day
- [ ] PRO: max 60 research queries/day
- [ ] Copilot: max 3 concurrent active sessions

### Security
- [ ] `ALLOW_PROTOTYPE_USER` is **not set** in production env
- [ ] `NODE_ENV=production` set in Vercel
- [ ] `CLERK_SECRET_KEY` present (middleware enforces auth)
- [ ] `CRON_SECRET` set (cron routes return 401 without it)
- [ ] Rate limits active: research 20 req/min, prices 60/min, journal 30/min

---

## 8. Post-Deploy Smoke

```bash
BASE_URL=https://tradeguard.app pnpm smoke
```

All 15 checks must pass before announcing launch.

---

## 9. Tag + Release

```bash
git tag -a v1.0.0 -m "Public India launch — Phase 1 complete"
git push origin v1.0.0
```

---

## 10. Launch Announcement Checklist

- [ ] Smoke passes on production URL
- [ ] Razorpay payment tested end-to-end (live keys)
- [ ] Demo user `demo@tradeguard.app` visible in DB with seed data
- [ ] Clerk prod app active; sign-up flow tested on mobile
- [ ] Landing page SEBI citation link resolves
- [ ] WhatsApp share button tested on mobile
- [ ] NSE market hours badge shows correct state at 09:15 IST
- [ ] Journal streak increments correctly across midnight IST

---

*Generated: 2026-06-17 | Sprint P1 | v1.0.0*

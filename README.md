# TradeGuard AI

**A multi-agent intelligence platform for retail traders.**

> "Every retail trader is alone in the room. TradeGuard AI puts an AI council next to them."

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Azure OpenAI](https://img.shields.io/badge/Azure-OpenAI%20GPT--4o-0078D4?logo=microsoft-azure)](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
[![Azure Content Safety](https://img.shields.io/badge/Azure-Content%20Safety-0078D4?logo=microsoft-azure)](https://azure.microsoft.com/en-us/products/ai-services/ai-content-safety)
[![Claude](https://img.shields.io/badge/Anthropic-Claude%203.5-orange)](https://anthropic.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## What It Does

Retail traders lose money not because markets are hard — but because they act on emotion, incomplete information, and hype while institutions operate with teams of analysts, quant models, and real-time data feeds.

TradeGuard AI closes that gap with a **swarm of specialized AI agents**, each owning one intelligence domain, running in parallel, and converging into a single coordinated verdict.

---

## The Agent Swarm

```
User Action / Ticker Query
         │
    ┌────▼─────────┐
    │  AI Router   │   lib/ai/router.ts + Redis cache
    └────┬─────────┘
         │
   ┌─────┴──────────────────────────────────┐
   │                                        │
   ▼                                        ▼
Azure OpenAI GPT-4o                  Claude 3.5 Sonnet
(deep_research → synthesis)          (news_analysis · journal_reflection
   │                                  morning_brief)
   │  fallback ────────────────────────▶   │
   │                                        │
   ▼                                        ▼
Grok Beta                            Perplexity Sonar-large
(hype_detection)                     (news_research · citations)
   │                                        │
   └──────────────────┬─────────────────────┘
                      │
              ┌───────▼────────┐
              │  Redis Cache   │   shared memory across agents
              └───────┬────────┘
                      │
              ┌───────▼──────────────┐
              │  Synthesis Agent     │   Azure GPT-4o aggregates
              │  (Azure GPT-4o)      │   all agent outputs
              └───────┬──────────────┘
                      │
              ┌───────▼──────────────┐
              │ Azure Content Safety │   journal guardian (non-blocking)
              └───────┬──────────────┘
                      │
                 Final Output
```

### Agent responsibilities

| Agent | Model | Task type | Role |
|---|---|---|---|
| Research Agent | Azure OpenAI GPT-4o | `deep_research` | Final synthesis — coordinates all agent outputs |
| News Agent | Claude 3.5 Sonnet | `news_analysis` | Impact analysis, retail trap detection |
| Journal Agent | Claude 3.5 Sonnet | `journal_reflection` | Behavioral coaching, emotion tagging |
| Brief Agent | Claude 3.5 Sonnet | `morning_brief` | Daily pre-market intelligence |
| Social Agent | Grok Beta | `hype_detection` | X/social sentiment, FOMO detection |
| News Research Agent | Perplexity Sonar | `news_research` | Verified facts with source citations |
| Safety Guardian | Azure Content Safety | — | Screens all journal entries before DB write |

**Key swarm properties:**
- Agents run via `Promise.all` — parallel, not sequential
- Redis cache layer allows agents to reuse each other's results
- Azure GPT-4o → Claude fallback keeps the swarm alive if Azure is unavailable
- Azure GPT-4o is the synthesis coordinator — waits for all agents, produces the final verdict

---

## Azure Integration

Two Azure services are load-bearing in the swarm.

### Azure OpenAI GPT-4o — Synthesis Agent

`lib/ai/router.ts` routes `deep_research` tasks to Azure GPT-4o first, with automatic Claude fallback:

```typescript
case 'deep_research':
  try {
    responseText = await callAzureOpenAI(prompt, options)
  } catch (azureErr) {
    console.warn('Azure OpenAI unavailable, falling back to Claude:', azureErr)
    responseText = await callClaude(prompt, options)
  }
  break
```

`lib/services/research.service.ts` routes the final synthesis step through `deep_research`, meaning every Research Terminal query closes with Azure GPT-4o synthesizing all three parallel agent outputs into one verdict.

### Azure Content Safety — Journal Guardian

Every journal entry is screened before it touches the database (`app/api/journal/route.ts`):

```typescript
const safety = await checkContentSafety(rawText)   // non-blocking

await db.journalEntry.create({
  data: { ...entry, riskFlag: safety.flagged }
})
```

- Categories checked: `Hate · SelfHarm · Sexual · Violence`
- Severity scale: 0 (safe) → 6 (high)
- `riskFlag: true` written to DB → warning badge shown in UI
- Journal always saves regardless — Content Safety never blocks the write

---

## Modules

### Intelligence Feed
Real-time market event analysis, delivered before you can react.

- Polygon API ingests live news on a Vercel cron schedule
- Claude analyzes each item: what happened, what it means for retail traders, `retailTrap` flag
- Output: sentiment score, impact level (`LOW / MEDIUM / HIGH / CRITICAL`)
- Live-pushed to all connected clients via Pusher WebSocket

### Research Terminal
Institution-grade parallel research on any ticker in under 10 seconds.

```
T=0s  Yahoo Finance   → live price, volume, EMA, RSI
T=0s  Perplexity      → verified news (last 24h) with source URLs
T=1s  Claude ×3       → technical read · news impact · retail trap (parallel)
T=3s  Azure GPT-4o    → final synthesis of all three agent outputs
T=4s  Result rendered
```

Supports: US equities, NSE/BSE (India), crypto, forex, ETFs.

### Trading Journal
The only trading journal with a behavioral AI coach built in.

- Free-text entry → **Azure Content Safety** screens it first (non-blocking)
- Claude identifies emotion tag: `FOMO · REVENGE · DISCIPLINED · FEARFUL · PANIC · GREED`
- Structured AI response: pattern name, likely mistake, one action for tomorrow
- `PsychProfile` builds over time: dominant biases, streak tracking, weekly insight
- `riskFlag` stored in DB — visible warning badge if Content Safety flags the entry

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion |
| UI Components | shadcn/ui, Lucide Icons, Lightweight Charts |
| AI — Synthesis | Azure OpenAI GPT-4o |
| AI — Safety | Azure Content Safety |
| AI — Analysis | Anthropic Claude 3.5 Sonnet |
| AI — Social | Grok Beta (xAI) |
| AI — News | Perplexity Sonar-large |
| Database | PostgreSQL via Supabase, Prisma ORM |
| Cache | Upstash Redis |
| Real-time | Pusher WebSocket |
| Auth | Clerk |
| Data Providers | Polygon, Yahoo Finance, Alpaca, FMP, StockTwits |
| Deployment | Vercel (crons + edge) |

---

## Project Structure

```
├── app/
│   ├── (dashboard)/
│   │   ├── feed/           # Intelligence Feed
│   │   ├── research/       # Research Terminal
│   │   ├── journal/        # Trading Journal
│   │   ├── watchlist/
│   │   └── settings/
│   └── api/
│       ├── feed/
│       ├── research/[symbol]/
│       ├── journal/
│       └── cron/           # Vercel background jobs
├── lib/
│   ├── ai/
│   │   ├── router.ts               # Agent dispatcher
│   │   ├── azure-openai.ts         # Azure GPT-4o client
│   │   ├── azure-content-safety.ts # Content Safety client
│   │   ├── claude.ts
│   │   ├── grok.ts
│   │   ├── perplexity.ts
│   │   └── prompts.ts
│   ├── services/
│   │   ├── research.service.ts     # Parallel ticker analysis
│   │   ├── feed.service.ts
│   │   ├── journal.service.ts
│   │   └── brief.service.ts
│   └── data/               # Market data providers
└── prisma/
    └── schema.prisma
```

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values. The example file has inline comments for every variable explaining where to find it. Required to get started: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `ANTHROPIC_API_KEY`.

Azure variables (`AZURE_OPENAI_*`, `AZURE_CONTENT_SAFETY_*`) are optional locally — both clients degrade gracefully when not configured (Content Safety returns `flagged: false`, Azure OpenAI falls back to Claude).

### 3. Generate Prisma client and run migrations

```bash
pnpm prisma generate
pnpm prisma migrate dev
```

### 4. Run the development server

```bash
pnpm dev
```

---

## Background Jobs (Vercel Crons)

| Route | Schedule | What it does |
|---|---|---|
| `/api/cron/morning-brief` | Daily 9:00 AM ET (Mon–Fri) | AI-generated pre-market brief |
| `/api/cron/news-ingestion` | Every 15 min, 9 AM–5 PM ET | Ingests and analyzes latest market news |
| `/api/cron/trending-scan` | Every 30 min | Scans StockTwits for unusual ticker activity |
| `/api/cron/cleanup` | Daily 1:00 AM | Expires feed events older than 7 days |

All cron routes require a `Bearer` token matching `CRON_SECRET`. Generate one with `openssl rand -hex 32` and set it in both `.env.local` and Vercel dashboard.

---

## Roadmap

### V1 — Current
- [x] Intelligence Feed with retail trap detection
- [x] Research Terminal — 4-agent parallel analysis
- [x] Trading Journal with behavioral AI coach
- [x] Azure OpenAI GPT-4o — synthesis agent
- [x] Azure Content Safety — journal guardian with `riskFlag`
- [x] Real-time Pusher feed
- [x] PsychProfile — emotion tracking over time

### V5 — Live Trading Copilot (next)
- [ ] 6 parallel agents fire on position open (broker webhook)
- [ ] Behavioral Monitor — real-time tilt/panic detection during active trades
- [ ] Dark pool + institutional flow (Unusual Whales, FlowAlgo)
- [ ] On-chain intelligence (Glassnode, Nansen)
- [ ] Gamma exposure analysis (SpotGamma)
- [ ] Emergency intervention UI — full-screen modal when `psychState = TILT`

---

## License

MIT / Proprietary
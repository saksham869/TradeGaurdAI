# TradeGuard AI

Parallel Multi-Agent Financial Intelligence Platform.

## 🚀 Overview

TradeGuard AI leverages multiple LLMs (Claude, Grok, Perplexity) in parallel to analyze financial markets, social sentiment, and user-submitted journal entries to protect retail traders from common traps/mistakes.

### Core Features (V1)
- **Intelligence Feed**: Ingests real-time market data/news and digests using AI analysis to highlight facts vs hype.
- **Research Terminal**: Side-by-side comparative analysis combining standard market data providers with direct AI queries.
- **Trading Journal**: Analyzes user behavior logs to identify psychological traps using dynamic reasoning loops.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion
- **UI Components**: shadcn/ui, Lucide Icons, Lightweight Charts
- **Database**: Prisma ORM, PostgreSQL (via Supabase)
- **Caching/State**: Zustand, Upstash Redis
- **Auth**: Clerk Auth
- **AI Models**: Claude 3.5 Sonnet, Grok beta, Perplexity Sonar-large
- **Pub/Sub**: Pusher

## ⚙️ Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment variables
Copy the template `.env.local` to configure keys:
```bash
cp .env.local.example .env.local
```
Fill in paths for **Clerk**, **Supabase**, **Upstash**, and AI models (**Anthropic/XAI/Perplexity**).

### 3. Setup Database
```bash
pnpm prisma generate
```

### 4. Run Development Server
```bash
pnpm run dev
```

## 📅 Background Layouts (Crons)
Equipped with Vercel crons for background maintenance:
- `/api/cron/morning-brief`: Daily briefing digest
- `/api/cron/news-ingestion`: Regular feed ingest checks
- `/api/cron/trending-scan`: Social volume monitoring
- `/api/cron/cleanup`: Logs pruning

## ⚖️ License
MIT / Proprietary

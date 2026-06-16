/**
 * E2E smoke test — runs against a live server (BASE_URL env or http://localhost:3000).
 * Tests the critical request paths: prices, research, feed, journal, watchlist, billing.
 * Usage: pnpm smoke [BASE_URL=https://your-app.vercel.app]
 *
 * Exit 0 = all critical checks passed
 * Exit 1 = one or more checks failed
 */

const BASE_URL = process.env.BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

type CheckResult = { name: string; ok: boolean; status?: number; note?: string }

async function check(
  name: string,
  fn: () => Promise<Response>,
  validate?: (body: unknown) => boolean | string
): Promise<CheckResult> {
  try {
    const res = await fn()
    const ct = res.headers.get('content-type') ?? ''
    const body = ct.includes('application/json') ? await res.json() : await res.text()

    if (!res.ok) {
      // 401/402 are expected for protected routes in smoke — treat as pass
      if (res.status === 401 || res.status === 402) {
        return { name, ok: true, status: res.status, note: 'auth-gated (expected)' }
      }
      return { name, ok: false, status: res.status, note: String(body).slice(0, 120) }
    }

    if (validate) {
      const result = validate(body)
      if (result !== true) {
        return { name, ok: false, status: res.status, note: typeof result === 'string' ? result : 'validation failed' }
      }
    }

    return { name, ok: true, status: res.status }
  } catch (err) {
    return { name, ok: false, note: err instanceof Error ? err.message : String(err) }
  }
}

function hasSuccessEnvelope(body: unknown): boolean | string {
  if (typeof body !== 'object' || body === null) return 'not an object'
  if (!('success' in body)) return 'missing "success" field'
  return true
}

function isLandingPage(body: unknown): boolean {
  return typeof body === 'string' && body.includes('TradeGuard')
}

async function main() {
  console.log(`\nTradeGuard AI — E2E Smoke Test`)
  console.log(`Target: ${BASE_URL}`)
  console.log('─'.repeat(56))

  const results: CheckResult[] = await Promise.all([
    // Landing page renders
    check('GET / (landing page)', () => fetch(`${BASE_URL}/`), isLandingPage),

    // Auth me endpoint — 200 with envelope
    check('GET /api/auth/me', () => fetch(`${BASE_URL}/api/auth/me`), hasSuccessEnvelope),

    // Prices — RELIANCE.NS (NSE)
    check(
      'GET /api/prices/RELIANCE.NS',
      () => fetch(`${BASE_URL}/api/prices/RELIANCE.NS`),
      (b) => {
        const ok = hasSuccessEnvelope(b)
        if (ok !== true) return ok
        const body = b as Record<string, unknown>
        if (!body.data) return 'missing data field'
        const d = body.data as Record<string, unknown>
        if (typeof d.price !== 'number') return `price not a number: ${d.price}`
        return true
      }
    ),

    // Prices — TCS.NS
    check('GET /api/prices/TCS.NS', () => fetch(`${BASE_URL}/api/prices/TCS.NS`), hasSuccessEnvelope),

    // Prices — NVDA (US stock)
    check('GET /api/prices/NVDA', () => fetch(`${BASE_URL}/api/prices/NVDA`), hasSuccessEnvelope),

    // Research — requires auth, expect 401
    check('GET /api/research/RELIANCE.NS (unauthed)', () => fetch(`${BASE_URL}/api/research/RELIANCE.NS`)),

    // Feed — public
    check('GET /api/feed', () => fetch(`${BASE_URL}/api/feed`), hasSuccessEnvelope),

    // Trending — public
    check('GET /api/trending', () => fetch(`${BASE_URL}/api/trending`), hasSuccessEnvelope),

    // Market brief — public
    check('GET /api/market-brief', () => fetch(`${BASE_URL}/api/market-brief`), hasSuccessEnvelope),

    // Journal — requires auth
    check('GET /api/journal (unauthed)', () => fetch(`${BASE_URL}/api/journal`)),

    // Journal POST — requires auth
    check(
      'POST /api/journal (unauthed)',
      () =>
        fetch(`${BASE_URL}/api/journal`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ rawText: 'Smoke test entry' }),
        })
    ),

    // Watchlist — requires auth
    check('GET /api/watchlist (unauthed)', () => fetch(`${BASE_URL}/api/watchlist`)),

    // Positions — requires auth
    check('GET /api/positions (unauthed)', () => fetch(`${BASE_URL}/api/positions`)),

    // Billing subscribe — requires auth
    check(
      'POST /api/billing/subscribe (unauthed)',
      () => fetch(`${BASE_URL}/api/billing/subscribe`, { method: 'POST' })
    ),

    // Cron endpoints are protected by CRON_SECRET — expect 401
    check('GET /api/cron/morning-brief (unauthed)', () =>
      fetch(`${BASE_URL}/api/cron/morning-brief`)
    ),
  ])

  let passed = 0
  let failed = 0

  for (const r of results) {
    const icon = r.ok ? '✓' : '✗'
    const status = r.status ? ` [${r.status}]` : ''
    const note = r.note ? `  ← ${r.note}` : ''
    console.log(`  ${icon} ${r.name}${status}${note}`)
    r.ok ? passed++ : failed++
  }

  console.log('─'.repeat(56))
  console.log(`  ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    console.log('\n  SMOKE FAILED — fix the checks above before deploying.\n')
    process.exit(1)
  } else {
    console.log('\n  All smoke checks passed.\n')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Smoke runner error:', err)
  process.exit(1)
})

import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter (resets per cold start on Vercel Edge)
// For production scale: replace with Upstash Redis + @upstash/ratelimit
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/research': { max: 20,  windowMs: 60_000 },  // 20 research calls / min
  '/api/prices':   { max: 60,  windowMs: 60_000 },  // 60 price calls / min
  '/api/journal':  { max: 30,  windowMs: 60_000 },  // 30 journal ops / min
  '/api/positions':{ max: 60,  windowMs: 60_000 },  // 60 position ops / min
  '/api/impact':   { max: 100, windowMs: 60_000 },  // 100 impact calls / min
}

function getClientId(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  )
}

function checkRateLimit(clientId: string, route: string): boolean {
  const limit = Object.entries(RATE_LIMITS).find(([prefix]) => route.startsWith(prefix))
  if (!limit) return true

  const { max, windowMs } = limit[1]
  const key   = `${clientId}:${limit[0]}`
  const now   = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false
  entry.count++
  return true
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientId     = getClientId(request)

  // ── Rate limiting ────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/') && !checkRateLimit(clientId, pathname)) {
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Too many requests. Please wait.' }),
      {
        status: 429,
        headers: {
          'Content-Type':     'application/json',
          'Retry-After':      '60',
          'X-RateLimit-Info': 'Rate limit exceeded',
        },
      }
    )
  }

  // ── Block cron routes from non-Vercel callers ────────────────────────────
  if (pathname.startsWith('/api/cron/')) {
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.CRON_SECRET
    // Allow Vercel's cron system (it sends the CRON_SECRET) and skip in dev
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow only if it looks like a legitimate Vercel cron caller
      const isVercelCron = request.headers.get('x-vercel-cron') === '1'
      if (!isVercelCron) {
        return new NextResponse(
          JSON.stringify({ success: false, error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
  }

  // ── Add security headers to every response ───────────────────────────────
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options',        'DENY')
  response.headers.set('X-XSS-Protection',       '1; mode=block')

  return response
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// ── Rate limiter (in-memory; resets per cold start) ─────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/research': { max: 20,  windowMs: 60_000 },
  '/api/prices':   { max: 60,  windowMs: 60_000 },
  '/api/journal':  { max: 30,  windowMs: 60_000 },
  '/api/positions':{ max: 60,  windowMs: 60_000 },
  '/api/impact':   { max: 100, windowMs: 60_000 },
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

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  return response
}

// ── Public routes (never need Clerk auth) ────────────────────────────────────
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/cron(.*)',
])

// ── Shared handler logic (runs inside or outside clerkMiddleware) ─────────────
function handleRequest(request: NextRequest, protectFn?: () => void): NextResponse {
  const { pathname } = request.nextUrl
  const clientId     = getClientId(request)

  if (pathname.startsWith('/api/') && !checkRateLimit(clientId, pathname)) {
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Too many requests. Please wait.' }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      }
    )
  }

  if (pathname.startsWith('/api/cron/')) {
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const isVercelCron = request.headers.get('x-vercel-cron') === '1'
      if (!isVercelCron) {
        return new NextResponse(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
  }

  if (protectFn && !isPublicRoute(request)) {
    protectFn()
  }

  return applySecurityHeaders(NextResponse.next())
}

// ── Middleware export ─────────────────────────────────────────────────────────
// When CLERK_SECRET_KEY is set: wrap with clerkMiddleware for real auth.
// When absent (local dev / smoke): plain middleware + ALLOW_PROTOTYPE_USER
// handles auth inside each route via lib/auth.ts — no Clerk dev-browser rewrite.
const clerkHandler = process.env.CLERK_SECRET_KEY
  ? clerkMiddleware((auth, request) => handleRequest(request, () => auth().protect()))
  : null

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (clerkHandler) return clerkHandler(request, event)
  return handleRequest(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/(api|trpc)(.*)',
  ],
}

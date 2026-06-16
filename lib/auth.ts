import { auth, currentUser } from '@clerk/nextjs/server'

// Guard: production requires real Clerk keys. Throw at call time so the
// error surfaces clearly in logs rather than silently serving a prototype user.
function assertClerkInProd(): void {
  if (process.env.NODE_ENV === 'production' && !process.env.CLERK_SECRET_KEY) {
    throw new Error(
      '[auth] CLERK_SECRET_KEY is required in production. ' +
      'Set it in Vercel dashboard or your .env.production file.'
    )
  }
}

// Returns true only in a development environment with the explicit opt-in flag.
function isPrototypeModeAllowed(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_PROTOTYPE_USER === 'true'
  )
}

export async function getSession() {
  return auth()
}

export async function getCurrentUser() {
  return currentUser()
}

export async function getUserId(): Promise<string | null> {
  assertClerkInProd()

  if (!process.env.CLERK_SECRET_KEY) {
    if (isPrototypeModeAllowed()) return 'user_v1_prototype'
    return null
  }

  const { userId } = auth()
  return userId
}

export async function requireAuth(): Promise<string> {
  assertClerkInProd()

  if (!process.env.CLERK_SECRET_KEY) {
    if (isPrototypeModeAllowed()) return 'user_v1_prototype'
    throw new Error('[auth] Unauthorized — CLERK_SECRET_KEY not configured')
  }

  const { userId } = auth()
  if (!userId) throw new Error('Unauthorized')
  return userId
}
import { auth, currentUser } from '@clerk/nextjs/server'

// Prototype mode: when CLERK_SECRET_KEY is absent AND ALLOW_PROTOTYPE_USER=true,
// return a shared demo user. Works in any NODE_ENV — the flag is the gate.
function isPrototypeModeAllowed(): boolean {
  return (
    !process.env.CLERK_SECRET_KEY &&
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
  if (!process.env.CLERK_SECRET_KEY) {
    if (isPrototypeModeAllowed()) return 'user_v1_prototype'
    return null
  }
  const { userId } = auth()
  return userId
}

export async function requireAuth(): Promise<string> {
  if (!process.env.CLERK_SECRET_KEY) {
    if (isPrototypeModeAllowed()) return 'user_v1_prototype'
    throw new Error('[auth] Unauthorized — CLERK_SECRET_KEY not configured')
  }
  const { userId } = auth()
  if (!userId) throw new Error('Unauthorized')
  return userId
}

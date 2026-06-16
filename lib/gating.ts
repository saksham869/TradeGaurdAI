import db from './db'
import { redis } from './redis'

export type GatedAction =
  | 'watchlist:add'
  | 'research:run'
  | 'copilot:open'

// FREE limits
const FREE_LIMITS = {
  'watchlist:add': 5,   // max symbols in watchlist
  'research:run':  5,   // per-day research queries
  'copilot:open':  0,   // copilot is PRO-only
}

export class PlanLimitError extends Error {
  readonly statusCode = 402
  readonly action: GatedAction
  readonly limit: number
  readonly current: number

  constructor(action: GatedAction, limit: number, current: number) {
    super(
      `Plan limit reached for "${action}". ` +
      `FREE plan allows ${limit}; you have ${current}. ` +
      `Upgrade to PRO (₹499/month) to continue.`
    )
    this.action  = action
    this.limit   = limit
    this.current = current
  }
}

/**
 * Throws PlanLimitError (HTTP 402) when a FREE user exceeds their allowance.
 * PRO users always pass through.
 */
export async function assertWithinPlan(
  userId: string,
  action: GatedAction
): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } })
  if (!user) throw new Error('User not found')
  if (user.plan === 'PRO') return

  const limit = FREE_LIMITS[action]

  if (action === 'watchlist:add') {
    const count = await db.watchlistItem.count({ where: { userId } })
    if (count >= limit) throw new PlanLimitError(action, limit, count)
    return
  }

  if (action === 'copilot:open') {
    throw new PlanLimitError(action, limit, 1)
  }

  if (action === 'research:run') {
    // Track per-user daily research count in Redis
    const today    = new Date().toISOString().slice(0, 10)
    const cacheKey = `research:daily:${userId}:${today}`
    const rawCount = await redis?.get(cacheKey).catch(() => null)
    const count    = typeof rawCount === 'number' ? rawCount : 0
    if (count >= limit) throw new PlanLimitError(action, limit, count)
    // Increment counter (TTL: 25h to survive day boundaries)
    await redis?.incr(cacheKey).catch(() => null)
    await redis?.expire(cacheKey, 90_000).catch(() => null)
    return
  }
}
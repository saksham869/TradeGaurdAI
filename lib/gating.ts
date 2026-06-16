import db from './db'
import { redis } from './redis'

export type GatedAction =
  | 'watchlist:add'
  | 'research:run'
  | 'copilot:open'
  | 'journal:post'

// FREE daily limits
const FREE_LIMITS: Record<GatedAction, number> = {
  'watchlist:add': 5,   // max symbols in watchlist
  'research:run':  5,   // per-day research queries
  'copilot:open':  0,   // copilot is PRO-only
  'journal:post':  10,  // per-day journal entries
}

// PRO daily limits (where applicable; copilot + watchlist are unlimited for PRO)
const PRO_LIMITS: Partial<Record<GatedAction, number>> = {
  'research:run': 60,
  'journal:post': 10,
}

export class PlanLimitError extends Error {
  readonly statusCode = 402
  readonly action: GatedAction
  readonly limit: number
  readonly current: number

  constructor(action: GatedAction, limit: number, current: number) {
    super(
      `Plan limit reached for "${action}". ` +
      `Your plan allows ${limit}/day; you have ${current}. ` +
      `${limit <= 5 ? 'Upgrade to PRO (₹499/month) to continue.' : ''}`
    )
    this.action  = action
    this.limit   = limit
    this.current = current
  }
}

/**
 * Throws PlanLimitError (HTTP 402) when a user exceeds their plan allowance.
 * PRO users have higher limits; some actions remain gated at the PRO level too.
 */
export async function assertWithinPlan(
  userId: string,
  action: GatedAction
): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } })
  if (!user) throw new Error('User not found')

  const isPro  = user.plan === 'PRO'
  const limit  = isPro ? (PRO_LIMITS[action] ?? Infinity) : FREE_LIMITS[action]

  if (action === 'watchlist:add') {
    if (isPro) return // unlimited for PRO
    const count = await db.watchlistItem.count({ where: { userId } })
    if (count >= limit) throw new PlanLimitError(action, limit, count)
    return
  }

  if (action === 'copilot:open') {
    if (isPro) return // PRO-only — FREE always fails
    throw new PlanLimitError(action, limit, 1)
  }

  if (action === 'research:run') {
    const today    = new Date().toISOString().slice(0, 10)
    const cacheKey = `research:daily:${userId}:${today}`
    const rawCount = await redis?.get(cacheKey).catch(() => null)
    const count    = typeof rawCount === 'number' ? rawCount : 0
    if (count >= limit) throw new PlanLimitError(action, limit, count)
    await redis?.incr(cacheKey).catch(() => null)
    await redis?.expire(cacheKey, 90_000).catch(() => null)
    return
  }

  if (action === 'journal:post') {
    const today    = new Date().toISOString().slice(0, 10)
    const cacheKey = `journal:daily:${userId}:${today}`
    const rawCount = await redis?.get(cacheKey).catch(() => null)
    const count    = typeof rawCount === 'number' ? rawCount : 0
    if (count >= limit) throw new PlanLimitError(action, limit, count)
    await redis?.incr(cacheKey).catch(() => null)
    await redis?.expire(cacheKey, 90_000).catch(() => null)
    return
  }
}
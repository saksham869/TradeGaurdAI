export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { recomputeTraderModel } from '@/lib/services/traderModel.service'

// Cron "0 1 * * *" — recompute TraderModel for users active in last 7 days
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 7 * 24 * 3600_000)
  const activeUsers = await db.trade.findMany({
    where:   { updatedAt: { gte: cutoff } },
    select:  { userId: true },
    distinct: ['userId'],
  })

  const results: Record<string, string> = {}
  for (const { userId } of activeUsers) {
    try {
      await recomputeTraderModel(userId)
      results[userId] = 'ok'
    } catch (err) {
      results[userId] = err instanceof Error ? err.message : 'error'
    }
  }

  return NextResponse.json({ success: true, data: { processed: activeUsers.length, results } })
}

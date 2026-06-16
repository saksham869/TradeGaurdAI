import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'
import { assertWithinPlan, PlanLimitError } from '@/lib/gating'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const watchlist = await db.watchlistItem.findMany({
      where: { userId }
    })
    return NextResponse.json({ success: true, data: watchlist })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch watchlist' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { symbol, assetClass } = await request.json()
    if (!symbol) return NextResponse.json({ success: false, error: 'Symbol required' }, { status: 400 })

    const ticker = symbol.toUpperCase()

    // Plan gate — check before duplicate so the error message is accurate
    try {
      await assertWithinPlan(userId, 'watchlist:add')
    } catch (e) {
      if (e instanceof PlanLimitError) {
        return NextResponse.json({ success: false, error: e.message, upgrade: true }, { status: 402 })
      }
      throw e
    }

    // Check if duplicate
    const existing = await db.watchlistItem.findFirst({
      where: { userId, symbol: ticker }
    })

    if (existing) {
       return NextResponse.json({ success: true, data: existing, message: 'Already watchlisted' })
    }

    const item = await db.watchlistItem.create({
      data: {
        userId,
        symbol: ticker,
        assetClass: assetClass || 'STOCK'
      }
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
     console.error('Watchlist Add Error:', error)
     return NextResponse.json({ success: false, error: 'Failed to add to watchlist' }, { status: 500 })
  }
}

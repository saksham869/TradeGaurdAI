export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const trades = await db.trade.findMany({
      where: { userId },
      orderBy: { entryTime: 'desc' },
      include: {
        session: {
          select: {
            id: true,
            status: true,
            overallSignal: true,
            lastRefreshedAt: true,
            refreshCount: true,
          },
        },
      },
    })
    return NextResponse.json({ success: true, data: trades })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch positions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { symbol, direction, side, entryPrice, quantity, stopLoss, takeProfit, targetPrice, assetClass, notes, setupTag, statedConviction } =
      await request.json()

    // Accept both direction (new) and side (legacy) field names
    const tradeDirection = direction ?? side

    if (!symbol || !tradeDirection || entryPrice == null || quantity == null) {
      return NextResponse.json(
        { success: false, error: 'symbol, direction, entryPrice, quantity are required' },
        { status: 400 }
      )
    }

    if (!['LONG', 'SHORT'].includes(tradeDirection)) {
      return NextResponse.json(
        { success: false, error: 'direction must be LONG or SHORT' },
        { status: 400 }
      )
    }

    if (entryPrice <= 0 || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'entryPrice and quantity must be positive' },
        { status: 400 }
      )
    }

    const trade = await db.trade.create({
      data: {
        userId,
        symbol: symbol.toUpperCase().trim(),
        direction: tradeDirection,
        entryPrice,
        quantity,
        stopLoss:         stopLoss         ?? null,
        takeProfit:       takeProfit ?? targetPrice ?? null,
        assetClass:       assetClass       ?? 'STOCK',
        notes:            notes            ?? null,
        setupTag:         setupTag         ?? null,
        statedConviction: statedConviction ?? null,
      },
    })

    return NextResponse.json({ success: true, data: trade }, { status: 201 })
  } catch (error) {
    console.error('Trade Create Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create trade' }, { status: 500 })
  }
}

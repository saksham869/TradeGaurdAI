import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const positions = await db.position.findMany({
      where: { userId },
      orderBy: { openedAt: 'desc' },
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
    return NextResponse.json({ success: true, data: positions })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch positions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { symbol, side, entryPrice, quantity, stopLoss, targetPrice, assetClass, notes } =
      await request.json()

    if (!symbol || !side || entryPrice == null || quantity == null) {
      return NextResponse.json(
        { success: false, error: 'symbol, side, entryPrice, quantity are required' },
        { status: 400 }
      )
    }

    if (!['LONG', 'SHORT'].includes(side)) {
      return NextResponse.json(
        { success: false, error: 'side must be LONG or SHORT' },
        { status: 400 }
      )
    }

    if (entryPrice <= 0 || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'entryPrice and quantity must be positive' },
        { status: 400 }
      )
    }

    const position = await db.position.create({
      data: {
        userId,
        symbol: symbol.toUpperCase().trim(),
        side,
        entryPrice,
        quantity,
        stopLoss:    stopLoss    ?? null,
        targetPrice: targetPrice ?? null,
        assetClass:  assetClass  ?? 'STOCK',
        notes:       notes       ?? null,
        source: 'MANUAL',
      },
    })

    return NextResponse.json({ success: true, data: position }, { status: 201 })
  } catch (error) {
    console.error('Position Create Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create position' }, { status: 500 })
  }
}
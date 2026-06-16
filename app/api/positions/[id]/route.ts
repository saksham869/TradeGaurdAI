import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const trade = await db.trade.findFirst({
      where: { id: params.id, userId },
    })

    if (!trade) {
      return NextResponse.json({ success: false, error: 'Position not found' }, { status: 404 })
    }

    const session = await db.copilotSession.findUnique({
      where: { tradeId: trade.id },
    })

    let sessionWithPerspectives = null
    if (session) {
      const perspectives = await db.copilotPerspective.findMany({
        where: { sessionId: session.id, refreshIndex: session.refreshCount },
        orderBy: { type: 'asc' },
      })
      sessionWithPerspectives = { ...session, perspectives }
    }

    return NextResponse.json({
      success: true,
      data: { ...trade, session: sessionWithPerspectives },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch position' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const trade = await db.trade.findFirst({
      where: { id: params.id, userId },
    })

    if (!trade) {
      return NextResponse.json({ success: false, error: 'Position not found' }, { status: 404 })
    }

    if (trade.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'Cannot update a closed position' },
        { status: 400 }
      )
    }

    const { stopLoss, takeProfit, targetPrice, notes, status, exitPrice } = await request.json()
    const updateData: Record<string, unknown> = {}

    if (stopLoss               !== undefined) updateData.stopLoss   = stopLoss
    if (takeProfit ?? targetPrice !== undefined) updateData.takeProfit = takeProfit ?? targetPrice
    if (notes                  !== undefined) updateData.notes      = notes

    if (status === 'CLOSED') {
      if (!exitPrice || exitPrice <= 0) {
        return NextResponse.json(
          { success: false, error: 'exitPrice is required to close a position' },
          { status: 400 }
        )
      }

      const pnl =
        trade.direction === 'LONG'
          ? (exitPrice - trade.entryPrice) * trade.quantity
          : (trade.entryPrice - exitPrice) * trade.quantity

      const pnlPct =
        trade.direction === 'LONG'
          ? ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100
          : ((trade.entryPrice - exitPrice) / trade.entryPrice) * 100

      const rMultiple =
        trade.stopLoss != null
          ? pnl / (Math.abs(trade.entryPrice - trade.stopLoss) * trade.quantity)
          : null

      updateData.status    = 'CLOSED'
      updateData.exitPrice = exitPrice
      updateData.exitTime  = new Date()
      updateData.pnl       = pnl
      updateData.pnlPct    = pnlPct
      updateData.rMultiple = rMultiple

      // End any active session
      await db.copilotSession.updateMany({
        where: { tradeId: params.id, status: 'ACTIVE' },
        data:  { status: 'ENDED' },
      })
    }

    const updated = await db.trade.update({
      where: { id: params.id },
      data:  updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Trade Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update position' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const trade = await db.trade.findFirst({
      where: { id: params.id, userId },
    })

    if (!trade) {
      return NextResponse.json({ success: false, error: 'Position not found' }, { status: 404 })
    }

    // Cascade handles session + perspectives deletion via schema
    await db.trade.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'Position deleted' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete position' }, { status: 500 })
  }
}

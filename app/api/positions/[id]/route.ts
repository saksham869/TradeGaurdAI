import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const position = await db.position.findFirst({
      where: { id: params.id, userId },
    })

    if (!position) {
      return NextResponse.json({ success: false, error: 'Position not found' }, { status: 404 })
    }

    // Fetch session separately so we can filter perspectives to the latest refresh
    const session = await db.copilotSession.findUnique({
      where: { positionId: position.id },
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
      data: { ...position, session: sessionWithPerspectives },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch position' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const position = await db.position.findFirst({
      where: { id: params.id, userId },
    })

    if (!position) {
      return NextResponse.json({ success: false, error: 'Position not found' }, { status: 404 })
    }

    if (position.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'Cannot update a closed position' },
        { status: 400 }
      )
    }

    const { stopLoss, targetPrice, notes, status, exitPrice } = await request.json()
    const updateData: Record<string, unknown> = {}

    if (stopLoss    !== undefined) updateData.stopLoss    = stopLoss
    if (targetPrice !== undefined) updateData.targetPrice = targetPrice
    if (notes       !== undefined) updateData.notes       = notes

    if (status === 'CLOSED') {
      if (!exitPrice || exitPrice <= 0) {
        return NextResponse.json(
          { success: false, error: 'exitPrice is required to close a position' },
          { status: 400 }
        )
      }

      const pnlDollar =
        position.side === 'LONG'
          ? (exitPrice - position.entryPrice) * position.quantity
          : (position.entryPrice - exitPrice) * position.quantity

      const pnlPct =
        position.side === 'LONG'
          ? ((exitPrice - position.entryPrice) / position.entryPrice) * 100
          : ((position.entryPrice - exitPrice) / position.entryPrice) * 100

      updateData.status    = 'CLOSED'
      updateData.exitPrice = exitPrice
      updateData.closedAt  = new Date()
      updateData.pnlDollar = pnlDollar
      updateData.pnlPct    = pnlPct

      // End any active session — no-op if none exists
      await db.copilotSession.updateMany({
        where: { positionId: params.id, status: 'ACTIVE' },
        data:  { status: 'ENDED' },
      })
    }

    const updated = await db.position.update({
      where: { id: params.id },
      data:  updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Position Update Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update position' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const position = await db.position.findFirst({
      where: { id: params.id, userId },
    })

    if (!position) {
      return NextResponse.json({ success: false, error: 'Position not found' }, { status: 404 })
    }

    // Cascade handles session + perspectives deletion via schema
    await db.position.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'Position deleted' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete position' }, { status: 500 })
  }
}
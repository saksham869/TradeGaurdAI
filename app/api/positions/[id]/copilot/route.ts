import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'

// GET /api/positions/[id]/copilot
// Returns the current copilot session state with the latest perspectives.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    // Ownership check
    const position = await db.position.findFirst({
      where: { id: params.id, userId },
      select: { id: true, symbol: true, side: true, entryPrice: true, status: true },
    })

    if (!position) {
      return NextResponse.json({ success: false, error: 'Position not found' }, { status: 404 })
    }

    const session = await db.copilotSession.findUnique({
      where: { positionId: params.id },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No copilot session — POST /copilot/start to begin' },
        { status: 404 }
      )
    }

    // Latest perspectives only — uses index [sessionId, type, refreshIndex]
    const perspectives = await db.copilotPerspective.findMany({
      where: { sessionId: session.id, refreshIndex: session.refreshCount },
      orderBy: { type: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: { position, session: { ...session, perspectives } },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch copilot state' },
      { status: 500 }
    )
  }
}
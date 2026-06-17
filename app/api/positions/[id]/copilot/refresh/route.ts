export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'
import { runCopilotAnalysis } from '@/lib/services/copilot.service'

// POST /api/positions/[id]/copilot/refresh
// Increments refreshCount and re-runs all 6 agents with fresh data.
// Called by the 60-second interval, on price move >1%, or manually by the user.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
      where: { tradeId: params.id },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No session — POST /copilot/start first' },
        { status: 404 }
      )
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `Session is ${session.status} — cannot refresh` },
        { status: 400 }
      )
    }

    // Increment refreshCount before running so new perspectives land at the right index
    const updatedSession = await db.copilotSession.update({
      where: { id: session.id },
      data: { refreshCount: { increment: 1 }, lastRefreshedAt: new Date() },
    })

    // Re-run all 6 agents at the new refreshCount
    const result = await runCopilotAnalysis(updatedSession.id, trade)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Copilot Refresh Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to refresh copilot' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'
import { runCopilotAnalysis } from '@/lib/services/copilot.service'
import { assertWithinPlan, PlanLimitError } from '@/lib/gating'

// POST /api/positions/[id]/copilot/start
// Creates a CopilotSession for the position and runs the first 6-agent analysis.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    await assertWithinPlan(userId, 'copilot:open')
  } catch (e) {
    if (e instanceof PlanLimitError) {
      return NextResponse.json({ success: false, error: e.message, upgrade: true }, { status: 402 })
    }
    throw e
  }

  try {
    const position = await db.position.findFirst({
      where: { id: params.id, userId },
    })

    if (!position) {
      return NextResponse.json({ success: false, error: 'Position not found' }, { status: 404 })
    }

    if (position.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'Cannot start copilot on a closed position' },
        { status: 400 }
      )
    }

    // Idempotent — return existing session if already active
    const existing = await db.copilotSession.findUnique({
      where: { positionId: params.id },
    })

    if (existing && existing.status === 'ACTIVE') {
      const perspectives = await db.copilotPerspective.findMany({
        where: { sessionId: existing.id, refreshIndex: existing.refreshCount },
        orderBy: { type: 'asc' },
      })
      return NextResponse.json({
        success: true,
        data: { session: { ...existing, perspectives } },
        message: 'Session already active',
      })
    }

    // Create session (refreshCount starts at 0)
    const session = await db.copilotSession.create({
      data: { positionId: params.id },
    })

    // Run all 6 agents — writes CopilotPerspective rows and updates session consensus
    const result = await runCopilotAnalysis(session.id, position)

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    console.error('Copilot Start Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to start copilot session' }, { status: 500 })
  }
}
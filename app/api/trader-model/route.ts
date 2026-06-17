export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'
import { recomputeTraderModel } from '@/lib/services/traderModel.service'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    // Upsert-on-read: recompute if model doesn't exist yet
    let model = await db.traderModel.findUnique({ where: { userId } })
    if (!model) {
      await recomputeTraderModel(userId)
      model = await db.traderModel.findUnique({ where: { userId } })
    }
    return NextResponse.json({ success: true, data: model })
  } catch (error) {
    console.error('TraderModel GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load trader model' }, { status: 500 })
  }
}

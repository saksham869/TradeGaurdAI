export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function POST() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const today = new Date().toISOString().slice(0, 10)

    const directive = await db.mindDirective.findUnique({
      where: { userId_directiveDate: { userId, directiveDate: today } },
    })

    if (!directive) {
      return NextResponse.json({ success: false, error: 'No directive found for today' }, { status: 404 })
    }

    const updated = await db.mindDirective.update({
      where: { userId_directiveDate: { userId, directiveDate: today } },
      data:  { acknowledged: true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to acknowledge directive' }, { status: 500 })
  }
}

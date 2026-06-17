export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'
import { generateDirective } from '@/lib/services/mindEngine.service'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await db.user.findUnique({
      where:  { id: userId },
      select: { timezone: true, plan: true },
    })

    const today = new Date().toISOString().slice(0, 10)

    // Non-blocking generate if missing
    const existing = await db.mindDirective.findUnique({
      where: { userId_directiveDate: { userId, directiveDate: today } },
    })

    if (!existing) {
      // Generate asynchronously — don't block the response
      generateDirective(userId).catch(() => null)
      return NextResponse.json({ success: true, data: null, generating: true })
    }

    return NextResponse.json({
      success: true,
      data:    existing,
      plan:    user?.plan ?? 'FREE',
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch directive' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const directives = await db.mindDirective.findMany({
      where:   { userId },
      orderBy: { directiveDate: 'desc' },
      take:    14,
      select: {
        id:            true,
        directiveDate: true,
        acknowledged:  true,
        directive:     true,
      },
    })

    return NextResponse.json({ success: true, data: directives })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch history' }, { status: 500 })
  }
}

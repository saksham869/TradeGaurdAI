export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const expireLimit = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) // 7 days old
    
    await db.feedEvent.deleteMany({
      where: { publishedAt: { lt: expireLimit } }
    })
    
    await db.trendingSnapshot.deleteMany({
      where: { capturedAt: { lt: expireLimit } }
    })

    return NextResponse.json({ success: true, message: 'Cleanup Completed' })
  } catch (error) {
     console.error('Cleanup Error:', error)
     return NextResponse.json({ success: false, error: 'Failed to cleanup' }, { status: 500 })
  }
}

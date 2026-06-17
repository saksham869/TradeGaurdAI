export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { ingestNews } from '@/lib/services/feed.service'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await ingestNews()
    return NextResponse.json({ success: true, data: result, message: 'News Ingested' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to ingest news' }, { status: 500 })
  }
}

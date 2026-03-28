import { NextRequest, NextResponse } from 'next/server'
import { scanTrending } from '@/lib/services/trending.service'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await scanTrending()
    return NextResponse.json({ success: true, message: 'Trending Scan Completed' })
  } catch (error) {
     console.error('Scan Trending Error:', error)
     return NextResponse.json({ success: false, error: 'Failed to scan trending' }, { status: 500 })
  }
}

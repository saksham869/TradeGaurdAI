export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { generateMorningBrief } from '@/lib/services/brief.service'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const brief = await generateMorningBrief()
    return NextResponse.json({ success: true, data: brief, message: 'Morning Brief Sample Created' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to generate brief' }, { status: 500 })
  }
}

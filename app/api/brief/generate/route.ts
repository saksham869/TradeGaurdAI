export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { generateMorningBrief } from '@/lib/services/brief.service'

// Authenticated brief generation — no cron secret needed, uses user session.
// Called from the Feed page sidebar "Generate Brief" button.
export async function POST() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const brief = await generateMorningBrief()
    return NextResponse.json({ success: true, data: brief })
  } catch (error) {
    console.error('Brief generation error:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate brief' }, { status: 500 })
  }
}
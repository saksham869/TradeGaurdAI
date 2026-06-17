export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getEconomicCalendar } from '@/lib/data/fmp'

export async function GET(request: NextRequest) {
  // Graceful degradation — no FMP key → return empty calendar (feature off)
  if (!process.env.FMP_API_KEY) {
    return NextResponse.json({ success: true, data: [] })
  }

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || undefined
    const to   = searchParams.get('to')   || undefined

    const calendar = await getEconomicCalendar(from, to)
    return NextResponse.json({ success: true, data: calendar })
  } catch {
    return NextResponse.json({ success: true, data: [] })
  }
}

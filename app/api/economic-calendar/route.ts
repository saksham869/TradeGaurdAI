import { NextRequest, NextResponse } from 'next/server'
import { getEconomicCalendar } from '@/lib/data/fmp'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined

    const calendar = await getEconomicCalendar(from, to)
    return NextResponse.json({ success: true, data: calendar })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch calendar' }, { status: 500 })
  }
}

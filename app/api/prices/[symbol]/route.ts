export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getYahooQuote } from '@/lib/data/yahoo'

// Lightweight price-only endpoint — no AI, just Yahoo Finance live data.
// Used by the watchlist page to refresh prices without running full research.
export async function GET(request: NextRequest, { params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase()
  try {
    const q = await getYahooQuote(symbol)
    return NextResponse.json({
      success: true,
      data: {
        symbol,
        price:     q.price,
        change:    q.change,
        changePct: q.changePct,
        high:      q.high,
        low:       q.low,
        volume:    q.volume,
        name:      q.name,
        currency:  q.currency,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: `Price unavailable for ${symbol}` }, { status: 502 })
  }
}
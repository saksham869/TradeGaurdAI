export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getRegime } from '@/lib/services/regime.service'

// Cron: "30 2 * * 1-5" — refresh regime for both home indices before market open
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, string> = {}
  for (const symbol of ['^NSEI', '^GSPC']) {
    try {
      const regime = await getRegime(symbol)
      results[symbol] = `${regime.current_regime} (${(regime.confidence * 100).toFixed(0)}%, ${regime.source})`
    } catch (err) {
      results[symbol] = `error: ${err instanceof Error ? err.message : 'unknown'}`
    }
  }

  return NextResponse.json({ success: true, data: results })
}

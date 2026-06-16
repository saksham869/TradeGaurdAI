import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRegime, homeIndex } from '@/lib/services/regime.service'
import { getUserId } from '@/lib/auth'

const querySchema = z.object({
  symbol: z.string().min(1).max(20),
})

export async function GET(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = querySchema.safeParse({
    symbol: request.nextUrl.searchParams.get('symbol') ?? '',
  })

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'symbol query param required' }, { status: 400 })
  }

  try {
    // Regime is fetched for the home index, not the symbol itself
    const index  = homeIndex(parsed.data.symbol)
    const regime = await getRegime(index)
    return NextResponse.json({ success: true, data: { ...regime, resolvedIndex: index } })
  } catch (error) {
    console.error('Regime API error:', error)
    return NextResponse.json({ success: false, error: 'Regime service unavailable' }, { status: 503 })
  }
}

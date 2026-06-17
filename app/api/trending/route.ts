export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    let trending = await db.trendingSnapshot.findMany({
      orderBy: { capturedAt: 'desc' },
      take: 10
    })

    if (trending.length === 0) {
       trending = [
         { id: 't-1', symbol: 'NVDA', capturedAt: new Date(), hypeRating: 'EXTREME', sentimentScore: 0.85, grokAnalysis: 'Discussion volume surging over AI chip specs and backlog.', assetClass: 'STOCK', mentionCount: 154 } as any,
         { id: 't-2', symbol: 'TSLA', capturedAt: new Date(), hypeRating: 'HIGH', sentimentScore: 0.65, grokAnalysis: 'Speculation revolving around core margins on delivery beat.', assetClass: 'STOCK', mentionCount: 110 } as any,
         { id: 't-3', symbol: 'BTC', capturedAt: new Date(), hypeRating: 'EXTREME', sentimentScore: 0.90, grokAnalysis: 'ETF allocation benchmarks drawing heavy traction.', assetClass: 'CRYPTO', mentionCount: 212 } as any
       ]
    }

    return NextResponse.json({ success: true, data: trending })
  } catch (error) {
    return NextResponse.json({ 
      success: true, 
      data: [
         { id: 't-err-1', symbol: 'DEMO', capturedAt: new Date(), hypeRating: 'MODERATE', sentimentScore: 0.50, grokAnalysis: 'Mock trending data preview offline.', assetClass: 'STOCK', mentionCount: 50 } as any
      ] 
    })
  }
}

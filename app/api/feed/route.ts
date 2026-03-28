import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    let events = await db.feedEvent.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 20
    })

    // Fallback Mock Data for demoing with no database setup
    if (events.length === 0) {
      events = [
        {
          id: 'mock-1',
          symbol: 'TSLA',
          eventType: 'NEWS',
          headline: 'Tesla Cybertruck production hits weekly milestones.',
          source: 'Internal Scanner',
          sourceUrl: '#',
          rawSummary: 'Visual demo node showing production volume updates.',
          sentimentScore: 78,
          sentimentLabel: 'BULLISH',
          impactLevel: 'MEDIUM',
          retailTrap: false,
          retailTrapText: null,
          aiAnalysis: {
            whatHappened: 'Tesla delivered slightly above estimates on high-margin variants.',
            whatItMeans: 'Margin pressure might ease, but demand sustainability remains the core question.',
            retailMistake: 'Chasing the breakout before confirmation above local resistance levels.',
          },
          publishedAt: new Date(),
        } as any,
        {
          id: 'mock-2',
          symbol: 'NVDA',
          eventType: 'NEWS',
          headline: 'Nvidia maintains 90% AI chip market share despite competitor announcements.',
          source: 'MarketWire',
          sourceUrl: '#',
          rawSummary: 'Analysts raise targets citing infinite demand signals.',
          sentimentScore: 92,
          sentimentLabel: 'BULLISH',
          impactLevel: 'HIGH',
          retailTrap: true,
          retailTrapText: 'Late FOMO buyers entering right at supply zone.',
          aiAnalysis: {
            whatHappened: 'Competitor chips failed to match CUDA software ecosystem lock-in directly.',
            whatItMeans: 'Eps targets continue adjusting upwards, limiting multiples compression.',
            retailMistake: 'Buying with high leverage at all-time highs without using stop-losses.',
          },
          publishedAt: new Date(Date.now() - 1000 * 60 * 60),
        } as any
      ]
    }

    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    console.error('Feed API error:', error)
    // Return mock data even on full error for offline preview
    return NextResponse.json({ 
      success: true, 
      data: [
        {
          id: 'mock-err-1',
          symbol: 'SYSTEM',
          eventType: 'NEWS',
          headline: 'Dashboard Preview Mode Active',
          source: 'System',
          rawSummary: 'Database not connected. Displaying offline rendering preview.',
          sentimentScore: 50,
          sentimentLabel: 'NEUTRAL',
          impactLevel: 'LOW',
          aiAnalysis: {
             whatHappened: 'You have started the application purely with static mock structures.',
             whatItMeans: 'Configure .env.local with Supabase credentials to pull live data logs.',
          },
          publishedAt: new Date()
        }
      ] 
    })
  }
}

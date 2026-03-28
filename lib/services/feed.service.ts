import db from '../db'
import { getPolygonNews } from '../data/polygon'
import { routeAITask } from '../ai/router'
import { PROMPTS } from '../ai/prompts'
import { pusherServer } from '../pusher-server'

export async function ingestNews() {
  try {
    const newsItems = await getPolygonNews(undefined, 5) // Fetch 5 items
    
    const processedEvents = []

    for (const item of newsItems) {
      // Check if already processed to avoid duplicates
      const existing = await db.feedEvent.findFirst({
        where: { sourceUrl: item.article_url },
      })
      if (existing) continue

      const ticker = item.tickers?.[0] || null
      
      const aiPrompt = PROMPTS.NEWS_ANALYSIS({
        symbol: ticker || 'MARKET',
        headline: item.title,
        summary: item.description || '',
        priceChange: 'N/A',
        assetClass: 'STOCK',
      })

      const aiResponseText = await routeAITask('news_analysis', aiPrompt)
      let aiAnalysis = {}
      try {
         // Rule 6: Handle failing parse gracefully
         aiAnalysis = JSON.parse(aiResponseText)
      } catch (e) {
         console.error('Failed to parse AI Analysis for news feed:', aiResponseText)
         aiAnalysis = {
            whatHappened: item.description ? item.description.substring(0, 100) : item.title,
            whatItMeans: 'Unable to analyze impact.',
            retailMistake: 'None identified.',
            sentimentScore: 50,
            sentimentLabel: 'NEUTRAL',
            impactLevel: 'MEDIUM',
         }
      }

      // Save to DB
      const feedEvent = await db.feedEvent.create({
        data: {
          symbol: ticker,
          eventType: 'NEWS',
          headline: item.title,
          source: item.publisher?.name || 'Polygon',
          sourceUrl: item.article_url,
          rawSummary: item.description || '',
          aiAnalysis: aiAnalysis as any,
          sentimentScore: (aiAnalysis as any).sentimentScore ?? 50,
          sentimentLabel: (aiAnalysis as any).sentimentLabel ?? 'NEUTRAL',
          impactLevel: (aiAnalysis as any).impactLevel ?? 'MEDIUM',
          retailTrap: (aiAnalysis as any).isRetailTrap ?? false,
          retailTrapText: (aiAnalysis as any).retailTrapText || null,
          publishedAt: new Date(item.published_utc),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
        },
      })

      // Trigger Pusher update
      try {
          await pusherServer.trigger('global-feed', 'feed-update', feedEvent)
      } catch (pusherErr) {
          console.error('Pusher trigger failed:', pusherErr)
      }

      processedEvents.push(feedEvent)
    }

    return { processedCount: processedEvents.length }
  } catch (error) {
    console.error('Error in ingestNews service:', error)
    throw error
  }
}

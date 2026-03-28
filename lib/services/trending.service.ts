import db from '../db'
import { getStocktwitsTrending } from '../data/stocktwits'
import { routeAITask } from '../ai/router'
import { PROMPTS } from '../ai/prompts'

export async function scanTrending() {
  try {
     const messages = await getStocktwitsTrending()
     const counts: any = {}
     
     for (const msg of messages) {
       const ticker = msg.symbols?.[0]?.symbol
       if (ticker) {
         counts[ticker] = (counts[ticker] || 0) + 1
       }
     }

     for (const ticker of Object.keys(counts)) {
       // Only scan high volume tickers to avoid spam
       if (counts[ticker] > 2) { 
          const GrokPrompt = PROMPTS.HYPE_DETECTION({
            symbol: ticker,
            mentionCount: counts[ticker],
            priceChange: 0,
            hasNewsCatalyst: false
          })
          const grokResText = await routeAITask('hype_detection', GrokPrompt)
          
          let grokRes: any = {}
          try { grokRes = JSON.parse(grokResText) } catch { }

          await db.trendingSnapshot.create({
            data: {
              symbol: ticker,
              assetClass: 'STOCK',
              mentionCount: counts[ticker],
              sentimentScore: grokRes.xSentimentScore ?? 0.5,
              hypeRating: grokRes.hypeRating ?? 'MODERATE',
              grokAnalysis: grokRes.topNarrative || 'High discussion detected online.',
            }
          })
       }
     }

  } catch (error) {
     console.error('Error scanning trending:', error)
  }
}

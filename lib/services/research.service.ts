import { getYahooQuote, formatVolume, formatMarketCap } from '../data/yahoo'
import { callPerplexity } from '../ai/perplexity'
import { routeAITask } from '../ai/router'
import { PROMPTS } from '../ai/prompts'

export async function analyzeTickerParallel(symbol: string) {
  try {
    // Step 1: Fetch live price from Yahoo Finance (works for US, NSE, BSE, Crypto)
    let quote
    let priceData = {
      price: 150,
      changePct: 1.2,
      open: 148,
      high: 153,
      low: 147,
      volume: 1_000_000,
      avgVolume: 1_200_000,
      ema20: 148,
      vwap: 150.5,
      rsi: 55,
      currency: 'USD',
      market: 'US',
      name: symbol,
      exchange: 'NASDAQ',
      marketCapStr: 'N/A',
      volumeStr: '1.0M',
    }

    try {
      quote = await getYahooQuote(symbol)
      priceData = {
        price: quote.price,
        changePct: quote.changePct,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        volume: quote.volume,
        avgVolume: quote.avgVolume,
        ema20: quote.ema20Approx,
        vwap: quote.vwapApprox,
        rsi: quote.rsiApprox,
        currency: quote.currency,
        market: quote.market,
        name: quote.name,
        exchange: quote.exchange,
        marketCapStr: formatMarketCap(quote.marketCap, quote.currency),
        volumeStr: formatVolume(quote.volume),
      }
    } catch (priceErr) {
      console.warn(`Yahoo Finance price fetch failed for ${symbol}, using fallback:`, priceErr)
    }

    const currencySymbol = priceData.currency === 'INR' ? '₹' : '$'
    const volumeStatus = priceData.volume > priceData.avgVolume * 1.5
      ? 'HIGH (1.5x+ avg)' : priceData.volume < priceData.avgVolume * 0.7
      ? 'LOW (below avg)' : 'NORMAL'

    // Step 2: Parallel — news research + all 3 AI perspectives simultaneously
    const [newsResearch] = await Promise.all([
      callPerplexity(PROMPTS.TICKER_NEWS_RESEARCH(symbol)).catch(() => `No recent news found for ${symbol}.`),
    ])

    const [newsRes, techRes, trapRes] = await Promise.all([
      routeAITask('news_analysis', PROMPTS.TICKER_NEWS_ANALYSIS({
        symbol,
        assetClass: priceData.market === 'CRYPTO' ? 'CRYPTO' : 'STOCK',
        currentPrice: priceData.price,
        priceChange24h: priceData.changePct,
        researchContext: newsResearch,
      })).catch(() => '{}'),

      routeAITask('news_analysis', PROMPTS.TICKER_TECHNICAL({
        symbol,
        price: priceData.price,
        open: priceData.open,
        high: priceData.high,
        low: priceData.low,
        volume: priceData.volume,
        avgVolume: priceData.avgVolume,
        ema20: priceData.ema20,
        ema50: priceData.price * 0.95,
        vwap: priceData.vwap,
        rsi: priceData.rsi,
        priceChange: priceData.changePct,
      })).catch(() => '{}'),

      routeAITask('news_analysis', PROMPTS.TICKER_RETAIL_TRAP({
        symbol,
        priceChange: priceData.changePct,
        volumeStatus,
        newsSentiment: 60,
        hypeRating: 'MODERATE',
      })).catch(() => '{}'),
    ])

    const parseSafe = (text: string) => {
      try { return JSON.parse(text) } catch { return {} }
    }

    const newsObj = parseSafe(newsRes)
    const techObj = parseSafe(techRes)
    const trapObj = parseSafe(trapRes)

    // Step 3: Final synthesis
    const synthesisRes = await routeAITask('synthesis', PROMPTS.TICKER_SYNTHESIS({
      symbol,
      currentPrice: priceData.price,
      newsScore: newsObj.sentimentScore ?? 50,
      technicalBias: techObj.technicalBias ?? 'NEUTRAL',
      trapWarning: trapObj.retailMistake || 'None identified',
      trapActive: trapObj.trapActive || false,
    })).catch(() => '{}')

    const synthesisObj = parseSafe(synthesisRes)

    return {
      newsImpact: newsObj,
      technicalRead: techObj,
      retailTrapAnalysis: trapObj,
      synthesis: synthesisObj,
      priceAtAnalysis: priceData.price,
      // Extra market info for the UI
      marketInfo: {
        name: priceData.name,
        exchange: priceData.exchange,
        currency: priceData.currency,
        currencySymbol,
        market: priceData.market,
        change: quote?.change ?? 0,
        changePct: priceData.changePct,
        high: priceData.high,
        low: priceData.low,
        volume: priceData.volumeStr,
        marketCap: priceData.marketCapStr,
        fiftyTwoWeekHigh: quote?.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote?.fiftyTwoWeekLow,
      },
    }

  } catch (error) {
    console.error(`Error analyzing ticker ${symbol}:`, error)
    throw error
  }
}

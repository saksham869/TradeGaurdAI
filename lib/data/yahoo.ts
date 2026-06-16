/**
 * Yahoo Finance data fetcher — no API key required.
 * Supports US stocks, Indian NSE (.NS) and BSE (.BO), crypto, ETFs globally.
 */

import { redis } from '../redis'
import { OHLCVBar, calculateEMA, calculateRSI, calculateVWAP } from './indicators'

export type MarketType = 'US' | 'NSE' | 'BSE' | 'CRYPTO' | 'FOREX' | 'COMMODITY' | 'GLOBAL' | 'UNKNOWN'

// Well-known Indian tickers that are already suffixed or clearly Indian
// Forex pair patterns — user types EURUSD, EUR/USD, GBPUSD etc.
const FOREX_PAIRS = new Set([
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'NZDUSD', 'USDCAD',
  'USDINR', 'EURINR', 'GBPINR', 'USDBRL', 'USDCNY', 'USDSGD', 'USDMXN',
  'EURJPY', 'GBPJPY', 'EURGBP', 'XAUUSD', 'XAGUSD', // Gold & Silver
])

const KNOWN_NSE_TICKERS = new Set([
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'HINDUNILVR',
  'ITC', 'SBIN', 'BHARTIARTL', 'ASIANPAINT', 'MARUTI', 'BAJFINANCE',
  'BAJAJFINSV', 'TITAN', 'TATASTEEL', 'TATAMOTORS', 'SUNPHARMA', 'NESTLE',
  'POWERGRID', 'NTPC', 'ONGC', 'COALINDIA', 'JSWSTEEL', 'GRASIM',
  'LTIM', 'LT', 'TECHM', 'HCLTECH', 'DIVISLAB', 'DRREDDY', 'CIPLA',
  'APOLLOHOSP', 'ADANIPORTS', 'ADANIENT', 'AXISBANK', 'KOTAKBANK',
  'ULTRACEMCO', 'BRITANNIA', 'EICHERMOT', 'HEROMOTOCO', 'INDUSINDBK',
  'NIFTY50', 'SENSEX', 'BANKNIFTY',
])

const CRYPTO_TICKERS = new Set([
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'MATIC',
  'DOT', 'LINK', 'UNI', 'LTC', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP',
  'SHIB', 'TRX', 'TON', 'PEPE', 'SUI', 'INJ', 'WIF',
])

// Commodity tickers
const COMMODITY_TICKERS = new Set(['GC', 'SI', 'CL', 'NG', 'ZC', 'ZW', 'ZS', 'HG', 'PL'])

/**
 * Auto-detect which market a symbol belongs to.
 */
export function detectMarket(symbol: string): { market: MarketType; yahooSymbol: string; currency: string; exchange: string } {
  const s = symbol.toUpperCase().trim()

  // Already suffixed by user
  if (s.endsWith('.NS')) return { market: 'NSE', yahooSymbol: s, currency: 'INR', exchange: 'NSE' }
  if (s.endsWith('.BO')) return { market: 'BSE', yahooSymbol: s, currency: 'INR', exchange: 'BSE' }
  if (s.endsWith('-USD')) return { market: 'CRYPTO', yahooSymbol: s, currency: 'USD', exchange: 'Crypto' }
  if (s.endsWith('=X')) return { market: 'FOREX', yahooSymbol: s, currency: 'USD', exchange: 'Forex' }

  // Normalize forex input: EUR/USD → EURUSD, eurusd → EURUSD
  const noSlash = s.replace('/', '')
  if (FOREX_PAIRS.has(noSlash)) {
    const isGold = noSlash === 'XAUUSD'
    const isSilver = noSlash === 'XAGUSD'
    const market = isGold || isSilver ? 'COMMODITY' : 'FOREX'
    const label = isGold ? 'Gold (XAU)' : isSilver ? 'Silver (XAG)' : 'Forex'
    return { market, yahooSymbol: `${noSlash}=X`, currency: 'USD', exchange: label }
  }

  // Known Indian tickers
  if (KNOWN_NSE_TICKERS.has(s)) {
    return { market: 'NSE', yahooSymbol: `${s}.NS`, currency: 'INR', exchange: 'NSE' }
  }

  // Known crypto
  if (CRYPTO_TICKERS.has(s)) {
    return { market: 'CRYPTO', yahooSymbol: `${s}-USD`, currency: 'USD', exchange: 'Crypto' }
  }

  // Commodity futures
  if (COMMODITY_TICKERS.has(s)) {
    return { market: 'COMMODITY', yahooSymbol: `${s}=F`, currency: 'USD', exchange: 'Commodities' }
  }

  // Default: US stock
  return { market: 'US', yahooSymbol: s, currency: 'USD', exchange: 'NASDAQ/NYSE' }
}

export interface TickerQuote {
  symbol: string
  yahooSymbol: string
  market: MarketType
  exchange: string
  currency: string
  price: number
  open: number
  high: number
  low: number
  prevClose: number
  change: number
  changePct: number
  volume: number
  avgVolume: number
  marketCap: number | null
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  name: string
  // Technical indicators — real values when bars available, approx fallback labeled below
  ema20Approx: number   // kept for backwards compat — equals ema20
  vwapApprox: number    // kept for backwards compat — equals vwap
  rsiApprox: number     // kept for backwards compat — equals rsi
  ema20: number         // real EMA(20) from daily series, or approx
  vwap: number          // real VWAP from intraday bars, or approx
  rsi: number           // real RSI(14) from daily series, or approx
  indicatorsReal: boolean // true = computed from bar series; false = approximation
}

function isMarketHours(): boolean {
  const now = new Date()
  const h = now.getUTCHours()
  // Rough check: NYSE 14:30–21:00 UTC or NSE 3:45–10:00 UTC
  return (h >= 14 && h < 21) || (h >= 3 && h < 10)
}

function barCacheTTL(): number {
  return isMarketHours() ? 60 * 15 : 60 * 60
}

/**
 * Fetch daily OHLCV bars from Yahoo Finance (up to 120 trading days ≈ 6 months).
 * Cached in Redis with 15m TTL during market hours, 1h otherwise.
 */
export async function getDailyBars(symbol: string, days = 120): Promise<OHLCVBar[]> {
  const { yahooSymbol } = detectMarket(symbol)
  const cacheKey = `bars:daily:${yahooSymbol}:${days}`

  try {
    const cached = await redis?.get(cacheKey)
    if (cached) return cached as OHLCVBar[]
  } catch { /* Redis unavailable */ }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=6mo`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`Yahoo chart ${yahooSymbol} returned ${res.status}`)

  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) throw new Error(`No bar data for ${yahooSymbol}`)

  const timestamps: number[] = result.timestamp ?? []
  const q = result.indicators?.quote?.[0] ?? {}
  const bars: OHLCVBar[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const c = q.close?.[i]
    if (c == null) continue
    bars.push({
      timestamp: timestamps[i],
      open:   q.open?.[i]   ?? c,
      high:   q.high?.[i]   ?? c,
      low:    q.low?.[i]    ?? c,
      close:  c,
      volume: q.volume?.[i] ?? 0,
    })
  }

  const trimmed = bars.slice(-days)
  try {
    await redis?.set(cacheKey, trimmed, { ex: barCacheTTL() })
  } catch { /* Redis unavailable */ }

  return trimmed
}

/**
 * Fetch 15-minute intraday bars for VWAP calculation (last 5 days).
 * Cached in Redis with 15m TTL during market hours, 1h otherwise.
 */
export async function getIntradayBars(symbol: string): Promise<OHLCVBar[]> {
  const { yahooSymbol } = detectMarket(symbol)
  const cacheKey = `bars:intraday:${yahooSymbol}`

  try {
    const cached = await redis?.get(cacheKey)
    if (cached) return cached as OHLCVBar[]
  } catch { /* Redis unavailable */ }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=15m&range=5d`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return []

  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) return []

  const timestamps: number[] = result.timestamp ?? []
  const q = result.indicators?.quote?.[0] ?? {}
  const bars: OHLCVBar[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const c = q.close?.[i]
    if (c == null) continue
    bars.push({
      timestamp: timestamps[i],
      open:   q.open?.[i]   ?? c,
      high:   q.high?.[i]   ?? c,
      low:    q.low?.[i]    ?? c,
      close:  c,
      volume: q.volume?.[i] ?? 0,
    })
  }

  try {
    await redis?.set(cacheKey, bars, { ex: barCacheTTL() })
  } catch { /* Redis unavailable */ }

  return bars
}

/**
 * Fetch live quote from Yahoo Finance for any global stock.
 */
export async function getYahooQuote(symbol: string): Promise<TickerQuote> {
  const detected = detectMarket(symbol)
  const { yahooSymbol, market, currency, exchange } = detected

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5d`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache 60 seconds
    })

    if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status} for ${yahooSymbol}`)

    const json = await res.json()
    const result = json?.chart?.result?.[0]

    if (!result) throw new Error(`No data returned for ${yahooSymbol}`)

    const meta = result.meta
    const quote = result.indicators?.quote?.[0]
    const closes = quote?.close?.filter(Boolean) || []
    const volumes = quote?.volume?.filter(Boolean) || []

    const price = meta.regularMarketPrice || meta.previousClose
    const prevClose = meta.chartPreviousClose || meta.previousClose || price
    const change = price - prevClose
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0
    const open = meta.regularMarketOpen || price
    const high = meta.regularMarketDayHigh || price * 1.01
    const low = meta.regularMarketDayLow || price * 0.99
    const volume = meta.regularMarketVolume || 0
    const avgVolume = meta.averageDailyVolume3Month || meta.averageDailyVolume10Day || volume

    // Fetch daily bars and intraday bars in parallel for real indicators
    const [dailyBars, intradayBars] = await Promise.all([
      getDailyBars(yahooSymbol, 120).catch(() => [] as OHLCVBar[]),
      getIntradayBars(yahooSymbol).catch(() => [] as OHLCVBar[]),
    ])

    let ema20Real: number | null = null
    let rsiReal: number | null = null
    let vwapReal: number | null = null

    if (dailyBars.length >= 21) {
      const dailyCloses = dailyBars.map(b => b.close)
      ema20Real = calculateEMA(dailyCloses, 20)
      rsiReal   = calculateRSI(dailyCloses, 14)
    }

    if (intradayBars.length > 0) {
      vwapReal = calculateVWAP(intradayBars)
    }

    const indicatorsReal = ema20Real !== null && rsiReal !== null && vwapReal !== null

    // Approx fallbacks (used when bars are unavailable)
    const ema20Fallback = closes.length > 0
      ? closes.slice(-5).reduce((a: number, b: number) => a + b, 0) / closes.slice(-5).length
      : price * 0.98
    const vwapFallback  = (high + low + price) / 3
    const rsiFallback   = changePct > 3 ? 72 : changePct > 1 ? 62 : changePct < -3 ? 28 : changePct < -1 ? 38 : 52

    const ema20 = ema20Real ?? ema20Fallback
    const vwap  = vwapReal  ?? vwapFallback
    const rsi   = rsiReal   ?? rsiFallback

    return {
      symbol: symbol.toUpperCase(),
      yahooSymbol,
      market,
      exchange,
      currency,
      price,
      open,
      high,
      low,
      prevClose,
      change,
      changePct,
      volume,
      avgVolume,
      marketCap: meta.marketCap || null,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || price * 1.3,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || price * 0.7,
      name: meta.longName || meta.shortName || symbol,
      ema20,
      vwap,
      rsi,
      ema20Approx: ema20,
      vwapApprox:  vwap,
      rsiApprox:   rsi,
      indicatorsReal,
    }
  } catch (error) {
    console.error(`Yahoo Finance error for ${yahooSymbol}:`, error)
    throw new Error(`Could not fetch price data for ${symbol}. Please check the ticker symbol.`)
  }
}

/**
 * Format market cap for display
 */
export function formatMarketCap(cap: number | null, currency: string): string {
  if (!cap) return 'N/A'
  const symbol = currency === 'INR' ? '₹' : '$'
  if (cap >= 1e12) return `${symbol}${(cap / 1e12).toFixed(2)}T`
  if (cap >= 1e9) return `${symbol}${(cap / 1e9).toFixed(2)}B`
  if (cap >= 1e7 && currency === 'INR') return `${symbol}${(cap / 1e7).toFixed(2)}Cr`
  return `${symbol}${(cap / 1e6).toFixed(0)}M`
}

/**
 * Format volume for display
 */
export function formatVolume(vol: number): string {
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(0)}K`
  return vol.toString()
}

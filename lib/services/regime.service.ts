/**
 * Regime service — fetches market regime from the Python HMM microservice.
 * Falls back to a heuristic rule if the service is unavailable.
 * NEVER throws — always returns a regime.
 */

import db from '../db'
import { redis } from '../redis'
import { getDailyBars } from '../data/yahoo'

export interface RegimeData {
  symbol:                  string
  current_regime:          'BULL_TREND' | 'BEAR_TREND' | 'CHOP' | 'CRISIS'
  confidence:              number
  posterior:               Record<string, number>
  transition_from_current: Record<string, number>
  regime_history_30d:      Array<{ date: string; regime: string }>
  model_meta:              Record<string, unknown>
  source:                  'hmm' | 'heuristic'
}

// Home index for regime context
export function homeIndex(symbol: string): string {
  return symbol.endsWith('.NS') || symbol.endsWith('.BO') ? '^NSEI' : '^GSPC'
}

const CACHE_TTL = 6 * 3600 // 6 hours

// ─── Heuristic fallback ─────────────────────────────────────────────────────

async function heuristicRegime(symbol: string): Promise<RegimeData> {
  const fallback = (regime: RegimeData['current_regime'], confidence: number): RegimeData => ({
    symbol,
    current_regime:          regime,
    confidence,
    posterior:               { BULL_TREND: 0, BEAR_TREND: 0, CHOP: 0, CRISIS: 0, [regime]: confidence },
    transition_from_current: { BULL_TREND: 0.25, BEAR_TREND: 0.25, CHOP: 0.25, CRISIS: 0.25 },
    regime_history_30d:      [],
    model_meta:              { source: 'heuristic' },
    source:                  'heuristic',
  })

  try {
    const bars = await getDailyBars(symbol, 60)
    if (bars.length < 50) return fallback('CHOP', 0.50)

    const closes  = bars.map(b => b.close)
    const vols    = bars.map(b => b.volume)

    // SMA20 and SMA50
    const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20
    const sma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50
    const price = closes[closes.length - 1]

    // 20-day volatility (std of log returns)
    const returns20 = closes.slice(-21).map((c, i, arr) => i > 0 ? Math.log(c / arr[i - 1]) : 0).slice(1)
    const meanR     = returns20.reduce((a, b) => a + b, 0) / returns20.length
    const vol20     = Math.sqrt(returns20.reduce((a, b) => a + (b - meanR) ** 2, 0) / returns20.length)

    // 1-year median volatility for comparison
    const allReturns = closes.slice(-252).map((c, i, arr) => i > 0 ? Math.log(c / arr[i - 1]) : 0).slice(1)
    const allMeanR   = allReturns.reduce((a, b) => a + b, 0) / allReturns.length
    const vol1y      = Math.sqrt(allReturns.reduce((a, b) => a + (b - allMeanR) ** 2, 0) / allReturns.length)

    let regime: RegimeData['current_regime']
    let confidence: number

    if (vol20 > vol1y * 1.8) {
      regime = 'CRISIS'; confidence = 0.60
    } else if (price > sma20 && sma20 > sma50) {
      regime = 'BULL_TREND'; confidence = 0.55
    } else if (price < sma20 && sma20 < sma50) {
      regime = 'BEAR_TREND'; confidence = 0.55
    } else {
      regime = 'CHOP'; confidence = 0.50
    }

    return {
      symbol,
      current_regime:          regime,
      confidence,
      posterior:               { BULL_TREND: 0, BEAR_TREND: 0, CHOP: 0, CRISIS: 0, [regime]: confidence },
      transition_from_current: { BULL_TREND: 0.25, BEAR_TREND: 0.25, CHOP: 0.25, CRISIS: 0.25 },
      regime_history_30d:      [],
      model_meta:              { source: 'heuristic', vol20: vol20.toFixed(4), vol1y: vol1y.toFixed(4) },
      source:                  'heuristic',
    }
  } catch {
    return fallback('CHOP', 0.50)
  }
}

// ─── Primary: call Python HMM service ────────────────────────────────────────

async function fetchFromService(symbol: string): Promise<RegimeData> {
  const url = process.env.REGIME_SERVICE_URL
  const key = process.env.REGIME_API_KEY
  if (!url) throw new Error('REGIME_SERVICE_URL not set')

  const res = await fetch(`${url}/regime/${encodeURIComponent(symbol)}`, {
    headers: { 'X-Regime-Key': key ?? '' },
    signal:  AbortSignal.timeout(15_000), // 15s timeout
  })

  if (!res.ok) throw new Error(`Regime service returned ${res.status}`)
  const data = await res.json()
  return { ...data, source: 'hmm' }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getRegime(symbol: string): Promise<RegimeData> {
  const cacheKey = `regime:${symbol}`

  // 1. Redis cache (6h TTL)
  try {
    const cached = await redis?.get(cacheKey)
    if (cached && typeof cached === 'object') return cached as RegimeData
  } catch { /* Redis unavailable */ }

  // 2. Python HMM service → persist RegimeSnapshot
  let data: RegimeData
  try {
    data = await fetchFromService(symbol)
    await db.regimeSnapshot.create({
      data: {
        symbol,
        regime:     data.current_regime,
        confidence: data.confidence,
        posterior:  data.posterior,
        transition: data.transition_from_current,
        source:     'hmm',
      },
    })
  } catch {
    // 3. Heuristic fallback
    data = await heuristicRegime(symbol)
    await db.regimeSnapshot.create({
      data: {
        symbol,
        regime:     data.current_regime,
        confidence: data.confidence,
        posterior:  data.posterior,
        transition: data.transition_from_current,
        source:     'heuristic',
      },
    }).catch(() => null) // best-effort
  }

  // Cache result
  try {
    await redis?.set(cacheKey, data, { ex: CACHE_TTL })
  } catch { /* Redis unavailable */ }

  return data
}

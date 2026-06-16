export interface OHLCVBar {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/**
 * Exponential Moving Average using standard smoothing factor k = 2/(n+1).
 * Requires at least n values; returns the final EMA value.
 */
export function calculateEMA(closes: number[], n: number): number {
  if (closes.length === 0) throw new Error('closes array is empty')
  const k = 2 / (n + 1)
  // Seed with SMA of first n values (or all values if fewer than n)
  const seedLen = Math.min(n, closes.length)
  let ema = closes.slice(0, seedLen).reduce((s, v) => s + v, 0) / seedLen
  for (let i = seedLen; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k)
  }
  return ema
}

/**
 * RSI using Wilder's smoothing (alpha = 1/period).
 * Standard 14-period. Returns 0–100.
 */
export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50 // not enough data

  let gains = 0
  let losses = 0

  // Initial average gain/loss from first `period` changes
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) gains += diff
    else losses += -diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period

  // Wilder smoothing for remaining bars
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const g = diff >= 0 ? diff : 0
    const l = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + g) / period
    avgLoss = (avgLoss * (period - 1) + l) / period
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/**
 * VWAP from intraday OHLCV bars: sum(typical_price × volume) / sum(volume).
 */
export function calculateVWAP(bars: OHLCVBar[]): number {
  const validBars = bars.filter(b => b.volume > 0)
  if (validBars.length === 0) return 0
  let tpv = 0
  let totalVol = 0
  for (const b of validBars) {
    const tp = (b.high + b.low + b.close) / 3
    tpv += tp * b.volume
    totalVol += b.volume
  }
  return totalVol > 0 ? tpv / totalVol : 0
}
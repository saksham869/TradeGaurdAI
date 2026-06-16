import { describe, it, expect } from 'vitest'
import { calculateEMA, calculateRSI, calculateVWAP, OHLCVBar } from '../indicators'

// Known fixture: 20 closes. EMA(3) computed by hand.
// k = 2/(3+1) = 0.5
// seed = avg(first 3) = (10+11+12)/3 = 11
// i=3: 13*0.5 + 11*0.5 = 12
// i=4: 14*0.5 + 12*0.5 = 13
// i=5: 13*0.5 + 13*0.5 = 13
const CLOSES_10 = [10, 11, 12, 13, 14, 13, 12, 11, 10, 9]

describe('calculateEMA', () => {
  it('returns seed SMA when closes.length == period', () => {
    const result = calculateEMA([10, 12, 14], 3)
    expect(result).toBeCloseTo((10 + 12 + 14) / 3, 5)
  })

  it('computes correct EMA(3) on known series', () => {
    // Hand-trace: seed=11, then 12, 13, 13, 12.5, 11.75, 10.875, 9.9375
    const result = calculateEMA(CLOSES_10, 3)
    expect(result).toBeCloseTo(9.9375, 3)
  })

  it('throws on empty array', () => {
    expect(() => calculateEMA([], 3)).toThrow()
  })

  it('handles period > length by seeding on all values', () => {
    // period=20, only 5 values → seed = average of 5
    const closes = [10, 20, 30, 40, 50]
    const result = calculateEMA(closes, 20)
    expect(result).toBeCloseTo(30, 5)
  })
})

// Known RSI fixture: 15 values designed to test Wilder smoothing.
// First 14 changes: 7 gains of 1 each, 7 losses of 1 each.
// avgGain = avgLoss = 7/14 = 0.5 → RS=1 → RSI=50
const RSI_NEUTRAL = [10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10]

describe('calculateRSI', () => {
  it('returns 50 on perfectly alternating series', () => {
    const result = calculateRSI(RSI_NEUTRAL, 14)
    expect(result).toBeCloseTo(50, 1)
  })

  it('returns 50 fallback when insufficient data', () => {
    expect(calculateRSI([1, 2, 3], 14)).toBe(50)
  })

  it('returns 100 when all moves are gains', () => {
    const rising = Array.from({ length: 20 }, (_, i) => i + 1)
    expect(calculateRSI(rising, 14)).toBe(100)
  })

  it('returns low RSI on consistent falling series', () => {
    const falling = Array.from({ length: 20 }, (_, i) => 20 - i)
    const rsi = calculateRSI(falling, 14)
    expect(rsi).toBeLessThan(10)
  })
})

describe('calculateVWAP', () => {
  it('returns 0 for empty array', () => {
    expect(calculateVWAP([])).toBe(0)
  })

  it('computes correct VWAP from two bars', () => {
    const bars: OHLCVBar[] = [
      { timestamp: 1, open: 10, high: 12, low: 8,  close: 11, volume: 100 },
      { timestamp: 2, open: 11, high: 14, low: 10, close: 13, volume: 200 },
    ]
    // tp1 = (12+8+11)/3 = 10.333..., tpv1 = 10.333*100 = 1033.33
    // tp2 = (14+10+13)/3 = 12.333..., tpv2 = 12.333*200 = 2466.67
    // vwap = (1033.33+2466.67) / 300 = 3500/300 = 11.666...
    expect(calculateVWAP(bars)).toBeCloseTo(11.667, 2)
  })

  it('ignores zero-volume bars', () => {
    const bars: OHLCVBar[] = [
      { timestamp: 1, open: 10, high: 12, low: 8,  close: 11, volume: 0   },
      { timestamp: 2, open: 11, high: 14, low: 10, close: 13, volume: 200 },
    ]
    // Only bar 2 counts: tp = (14+10+13)/3 = 12.333
    expect(calculateVWAP(bars)).toBeCloseTo(12.333, 2)
  })
})
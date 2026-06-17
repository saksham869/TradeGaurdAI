/**
 * TraderModel — pure TypeScript, zero AI calls.
 * Computes per-user behavioral statistics from closed trades + journal entries.
 *
 * Calibration gate: trades >= 20 AND journals >= 10
 * All stats with n < 5 land in "_lowSample" group.
 */

import db from '../db'

// ─── Hour bucket helper ──────────────────────────────────────────────────────

type HourBucket = 'pre-open' | 'open-12' | '12-14' | '14-close'

function hourBucket(date: Date, tzSymbol: string): HourBucket {
  // IST for NSE-focused symbols, ET otherwise. We approximate with a simple
  // UTC offset: IST = UTC+5:30, ET = UTC-5 (EST) / UTC-4 (EDT).
  // The caller passes the user's timezone; we use it for correct bucketing.
  const localHour = parseInt(
    date.toLocaleString('en-US', { timeZone: tzSymbol, hour: 'numeric', hour12: false }),
    10
  )
  if (localHour < 9 || localHour >= 16) return 'pre-open'
  if (localHour < 12) return 'open-12'
  if (localHour < 14) return '12-14'
  return '14-close'
}

// ─── Stats for a group ───────────────────────────────────────────────────────

interface GroupStats {
  winRate:     number
  expectancyR: number
  sampleSize:  number
}

function groupStats(rValues: number[]): GroupStats {
  const n = rValues.length
  if (n === 0) return { winRate: 0, expectancyR: 0, sampleSize: 0 }
  const wins = rValues.filter(r => r > 0).length
  const wr   = wins / n
  const exp  = rValues.reduce((s, r) => s + r, 0) / n
  return { winRate: round2(wr), expectancyR: round2(exp), sampleSize: n }
}

function round2(n: number) { return Math.round(n * 100) / 100 }

// ─── Public entry point ──────────────────────────────────────────────────────

export async function recomputeTraderModel(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { timezone: true },
  })
  const tz = user?.timezone ?? 'UTC'

  // Fetch closed trades with rMultiple + statedConviction + setupTag + regimeAtEntry
  const trades = await db.trade.findMany({
    where:   { userId, status: 'CLOSED' },
    orderBy: { entryTime: 'asc' },
    select: {
      id:               true,
      rMultiple:        true,
      setupTag:         true,
      regimeAtEntry:    true,
      statedConviction: true,
      entryTime:        true,
      pnl:              true,
    },
  })

  // Fetch journal count
  const journalCount = await db.journalEntry.count({ where: { userId } })

  const totalClosed = trades.length
  const calibrated  = totalClosed >= 20 && journalCount >= 10

  // Only trades with rMultiple contribute to R-stats
  const withR = trades.filter(t => t.rMultiple != null).map(t => ({
    ...t,
    r: t.rMultiple as number,
  }))

  // ── Core stats ───────────────────────────────────────────────────────────

  const n = withR.length
  let winRate: number | null     = null
  let avgWinR: number | null     = null
  let avgLossR: number | null    = null
  let expectancyR: number | null = null
  let profitFactor: number | null = null

  if (n >= 20) {
    const wins   = withR.filter(t => t.r > 0)
    const losses = withR.filter(t => t.r <= 0)
    winRate      = round2(wins.length / n)
    avgWinR      = wins.length   > 0 ? round2(wins.reduce((s, t)   => s + t.r, 0) / wins.length)   : 0
    avgLossR     = losses.length > 0 ? round2(losses.reduce((s, t) => s + t.r, 0) / losses.length) : 0
    expectancyR  = round2(winRate * (avgWinR ?? 0) - (1 - winRate) * Math.abs(avgLossR ?? 0))
    const grossWin  = wins.reduce((s, t)   => s + t.r, 0)
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.r, 0))
    profitFactor = grossLoss > 0 ? round2(grossWin / grossLoss) : null
  }

  // ── statsBySetup ─────────────────────────────────────────────────────────

  const bySetup: Record<string, number[]> = {}
  for (const t of withR) {
    const tag = t.setupTag ?? '_untagged'
    ;(bySetup[tag] ??= []).push(t.r)
  }
  const statsBySetup: Record<string, GroupStats | { _lowSample: true; n: number }> = {}
  for (const [tag, rs] of Object.entries(bySetup)) {
    statsBySetup[tag] = rs.length >= 5 ? groupStats(rs) : { _lowSample: true, n: rs.length }
  }

  // ── statsByRegime ─────────────────────────────────────────────────────────

  const byRegime: Record<string, number[]> = {}
  for (const t of withR) {
    const regime = t.regimeAtEntry ?? '_unknown'
    ;(byRegime[regime] ??= []).push(t.r)
  }
  const statsByRegime: Record<string, GroupStats | { _lowSample: true; n: number }> = {}
  for (const [regime, rs] of Object.entries(byRegime)) {
    statsByRegime[regime] = rs.length >= 5 ? groupStats(rs) : { _lowSample: true, n: rs.length }
  }

  // ── statsByHour ───────────────────────────────────────────────────────────

  const byHour: Record<HourBucket, number[]> = {
    'pre-open': [], 'open-12': [], '12-14': [], '14-close': [],
  }
  for (const t of withR) {
    const bucket = hourBucket(t.entryTime, tz)
    byHour[bucket].push(t.r)
  }
  const statsByHour: Record<string, GroupStats | { _lowSample: true; n: number }> = {}
  for (const [bucket, rs] of Object.entries(byHour)) {
    statsByHour[bucket] = rs.length >= 5 ? groupStats(rs) : { _lowSample: true, n: rs.length }
  }

  // ── statsAfterLoss / statsAfterWin ────────────────────────────────────────

  const statsAfterLoss: Record<string, GroupStats | { _lowSample: true; n: number }> = {}
  const statsAfterWin:  Record<string, GroupStats | { _lowSample: true; n: number }> = {}

  for (const k of [1, 2, 3]) {
    const afterLossR: number[] = []
    const afterWinR:  number[] = []

    for (let i = k; i < withR.length; i++) {
      const prev = withR.slice(i - k, i)
      const allLoss = prev.every(t => t.r <= 0)
      const allWin  = prev.every(t => t.r > 0)
      if (allLoss) afterLossR.push(withR[i].r)
      if (allWin)  afterWinR.push(withR[i].r)
    }

    const keyL = `after_${k}_loss`
    const keyW = `after_${k}_win`
    statsAfterLoss[keyL] = afterLossR.length >= 5 ? groupStats(afterLossR) : { _lowSample: true, n: afterLossR.length }
    statsAfterWin[keyW]  = afterWinR.length  >= 5 ? groupStats(afterWinR)  : { _lowSample: true, n: afterWinR.length }
  }

  // ── convictionCalib ───────────────────────────────────────────────────────

  const byConviction: Record<number, number[]> = {}
  for (const t of withR) {
    const stars = t.statedConviction ?? 0
    ;(byConviction[stars] ??= []).push(t.r)
  }
  const convictionCalib: Record<string, GroupStats | { _lowSample: true; n: number }> = {}
  for (const [stars, rs] of Object.entries(byConviction)) {
    convictionCalib[`stars_${stars}`] = rs.length >= 5 ? groupStats(rs) : { _lowSample: true, n: rs.length }
  }

  // ── Behavioral flags ──────────────────────────────────────────────────────

  const behavioralFlags: Array<{
    flag: string
    evidence: string
    sampleSize: number
  }> = []

  // 1. OVERSIZE_AFTER_WINS — avg pnl after 2+ consecutive wins > 1.3× baseline (n≥5)
  if (trades.length >= 5 && trades.filter(t => t.pnl != null).length >= 5) {
    const pnlTrades = trades.filter(t => t.pnl != null)
    const baseline  = pnlTrades.reduce((s, t) => s + Math.abs(t.pnl!), 0) / pnlTrades.length
    const afterWin2: number[] = []
    for (let i = 2; i < withR.length; i++) {
      if (withR[i-1].r > 0 && withR[i-2].r > 0 && trades[i].pnl != null) {
        afterWin2.push(Math.abs(trades[i].pnl!))
      }
    }
    if (afterWin2.length >= 5) {
      const avgAfterWin = afterWin2.reduce((s, v) => s + v, 0) / afterWin2.length
      if (avgAfterWin > baseline * 1.3) {
        behavioralFlags.push({
          flag: 'OVERSIZE_AFTER_WINS',
          evidence: `Average position size after 2+ consecutive wins is ${round2(avgAfterWin / baseline)}× baseline (n=${afterWin2.length}).`,
          sampleSize: afterWin2.length,
        })
      }
    }
  }

  // 2. REVENGE_FAST_REENTRY — ≥3 same-symbol re-entries <15min after a loss
  const lossTrades  = trades.filter(t => (t.rMultiple ?? 0) <= 0 || (t.pnl ?? 0) < 0)
  const revengeCount: Record<string, number> = {}
  for (const loss of lossTrades) {
    const lossTime   = loss.entryTime.getTime()
    const fastReentry = trades.filter(t =>
      t.id !== loss.id &&
      t.setupTag === loss.setupTag && // same-symbol proxy via setupTag
      t.entryTime.getTime() > lossTime &&
      t.entryTime.getTime() - lossTime < 15 * 60 * 1000
    )
    if (fastReentry.length > 0) {
      revengeCount[loss.setupTag ?? '_'] = (revengeCount[loss.setupTag ?? '_'] ?? 0) + 1
    }
  }
  const totalRevenge = Object.values(revengeCount).reduce((s, v) => s + v, 0)
  if (totalRevenge >= 3) {
    behavioralFlags.push({
      flag: 'REVENGE_FAST_REENTRY',
      evidence: `${totalRevenge} instances of re-entering a similar setup within 15 minutes of a loss.`,
      sampleSize: totalRevenge,
    })
  }

  // 3. LATE_DAY_LEAK — last-bucket expectancyR < overall − 0.3R (n≥8)
  const lateBucket = byHour['14-close']
  if (lateBucket.length >= 8 && expectancyR != null) {
    const lateStats = groupStats(lateBucket)
    if (lateStats.expectancyR < expectancyR - 0.3) {
      behavioralFlags.push({
        flag: 'LATE_DAY_LEAK',
        evidence: `Expectancy in last-hour trades: ${lateStats.expectancyR}R vs overall ${expectancyR}R (n=${lateBucket.length}).`,
        sampleSize: lateBucket.length,
      })
    }
  }

  // 4. CONVICTION_INVERTED — win rate at 5★ < win rate at ≤2★ (both n≥5)
  const highConv = [...(byConviction[5] ?? [])]
  const lowConv  = [...(byConviction[1] ?? []), ...(byConviction[2] ?? [])]
  if (highConv.length >= 5 && lowConv.length >= 5) {
    const wrHigh = highConv.filter(r => r > 0).length / highConv.length
    const wrLow  = lowConv.filter(r => r > 0).length / lowConv.length
    if (wrHigh < wrLow) {
      behavioralFlags.push({
        flag: 'CONVICTION_INVERTED',
        evidence: `Win rate at 5★ is ${(wrHigh*100).toFixed(0)}% (n=${highConv.length}) vs ≤2★ ${(wrLow*100).toFixed(0)}% (n=${lowConv.length}). High-conviction entries are underperforming.`,
        sampleSize: highConv.length + lowConv.length,
      })
    }
  }

  // ── Upsert TraderModel ────────────────────────────────────────────────────

  // Prisma Json fields require explicit cast to InputJsonValue
  type J = Parameters<typeof db.traderModel.create>[0]['data']['statsBySetup']
  const j = (v: unknown): J => v as J

  const payload = {
    totalClosedTrades: totalClosed,
    totalJournals:     journalCount,
    calibrated,
    winRate,
    avgWinR,
    avgLossR,
    expectancyR,
    profitFactor,
    statsBySetup:    j(statsBySetup),
    statsByRegime:   j(statsByRegime),
    statsByHour:     j(statsByHour),
    statsAfterLoss:  j(statsAfterLoss),
    statsAfterWin:   j(statsAfterWin),
    behavioralFlags: j(behavioralFlags),
    convictionCalib: j(convictionCalib),
  }

  await db.traderModel.upsert({
    where:  { userId },
    create: { userId, ...payload },
    update: payload,
  })
}

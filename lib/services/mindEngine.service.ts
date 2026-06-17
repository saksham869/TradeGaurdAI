/**
 * Mind Engine — generates the daily MindDirective for a user.
 * Fuses regime + TraderModel + live context → JSON directive via AI.
 */

import db from '../db'
import { routeAITask } from '../ai/router'
import { getRegime, homeIndex } from './regime.service'

const MIND_DIRECTIVE_PROMPT = (inputs: {
  symbol:          string
  regimeLabel:     string
  regimeConfidence:number
  posterior:       Record<string, number>
  calibrated:      boolean
  traderStats: {
    winRate:        number | null
    expectancyR:    number | null
    profitFactor:   number | null
    n:              number
    behavioralFlags:Array<{ flag: string; evidence: string; sampleSize: number }>
    statsBySetup:   Record<string, unknown>
    statsAfterLoss: Record<string, unknown>
  }
  context: {
    openTrades:       number
    yesterdayPnlR:    number | null
    streakDays:       number
    todayTradeCount:  number
    localTime:        string
  }
}) => `You are the Mind Engine — a risk manager for ONE specific retail trader.
Fuse market state with THIS trader's verified statistics.
Use ONLY the numbers provided below. Never invent statistics.
If not calibrated, give regime-only guidance and say the personal layer is calibrating.
Every claim about this trader cites its provided sample size.
Return ONLY valid JSON. No markdown. No code fences.

MARKET STATE:
Index: ${inputs.symbol}
Regime: ${inputs.regimeLabel} (confidence ${(inputs.regimeConfidence * 100).toFixed(0)}%)
Posterior: BULL ${((inputs.posterior['BULL_TREND']??0)*100).toFixed(0)}% / BEAR ${((inputs.posterior['BEAR_TREND']??0)*100).toFixed(0)}% / CHOP ${((inputs.posterior['CHOP']??0)*100).toFixed(0)}% / CRISIS ${((inputs.posterior['CRISIS']??0)*100).toFixed(0)}%

TRADER STATS (calibrated: ${inputs.calibrated}):
${inputs.calibrated ? `Win rate: ${((inputs.traderStats.winRate??0)*100).toFixed(0)}% (n=${inputs.traderStats.n})
Expectancy: ${(inputs.traderStats.expectancyR??0).toFixed(2)}R
Profit factor: ${inputs.traderStats.profitFactor ?? 'N/A'}
Behavioral flags: ${inputs.traderStats.behavioralFlags.map(f => `${f.flag} (${f.evidence})`).join('; ') || 'none'}
Setup stats: ${JSON.stringify(inputs.traderStats.statsBySetup).slice(0, 300)}
After-loss stats: ${JSON.stringify(inputs.traderStats.statsAfterLoss).slice(0, 200)}` : 'Not yet calibrated — fewer than 20 closed trades or 10 journals.'}

LIVE CONTEXT:
Open trades: ${inputs.context.openTrades}
Yesterday P&L: ${inputs.context.yesterdayPnlR != null ? `${inputs.context.yesterdayPnlR.toFixed(2)}R` : 'unknown'}
Journal streak: ${inputs.context.streakDays} days
Today trade count: ${inputs.context.todayTradeCount}
Local time: ${inputs.context.localTime}

Return this exact JSON shape:
{
  "headline": "One punchy sentence summarising today's edge.",
  "marketRead": "2 sentences on current regime and what it means for setups.",
  "personalRead": "2-3 sentences citing THIS trader's stats with n=. If not calibrated, say so explicitly.",
  "todayEV": "POSITIVE|NEGATIVE|NEUTRAL|UNKNOWN",
  "todayEVReason": "1-2 sentences with numbers.",
  "greenlightSetups": [{"setup":"name","winRate":0.0,"sampleSize":0}],
  "avoidSetups": [{"setup":"name","winRate":0.0,"sampleSize":0}],
  "behavioralWatch": "null or 1 sentence on the highest-priority flag.",
  "sizeGuidance": "NORMAL|REDUCED|MINIMUM|SIT_OUT_SUGGESTED",
  "sizeGuidanceReason": "1 sentence.",
  "oneRule": "One imperative sentence for today. No hedge words."
}
greenlightSetups and avoidSetups: include only setups with n≥5 from the stats provided. Empty arrays if uncalibrated or no qualifying setups.`


export async function generateDirective(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)

  // Check if today's directive already exists
  const existing = await db.mindDirective.findUnique({
    where: { userId_directiveDate: { userId, directiveDate: today } },
  })
  if (existing) return  // already generated today

  // Fetch inputs in parallel
  const [traderModel, psychProfile, openTrades, recentTrades, user] = await Promise.all([
    db.traderModel.findUnique({ where: { userId } }),
    db.psychProfile.findUnique({ where: { userId } }),
    db.trade.count({ where: { userId, status: 'OPEN' } }),
    db.trade.findMany({
      where:   { userId, status: 'CLOSED' },
      orderBy: { exitTime: 'desc' },
      take:    1,
      select:  { pnl: true, rMultiple: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ])

  const tz        = user?.timezone ?? 'UTC'
  const localTime = new Date().toLocaleString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })
  const homeIdx   = homeIndex('NIFTY50')

  let regimeData
  try {
    regimeData = await getRegime(homeIdx)
  } catch {
    regimeData = {
      current_regime: 'CHOP' as const,
      confidence: 0.50,
      posterior: { BULL_TREND: 0.25, BEAR_TREND: 0.25, CHOP: 0.50, CRISIS: 0.00 },
    }
  }

  const todayTrades = await db.trade.count({
    where: {
      userId,
      entryTime: { gte: new Date(new Date().setHours(0,0,0,0)) },
    },
  })

  const inputs = {
    symbol:           homeIdx,
    regimeLabel:      regimeData.current_regime,
    regimeConfidence: regimeData.confidence,
    posterior:        regimeData.posterior,
    calibrated:       traderModel?.calibrated ?? false,
    traderStats: {
      winRate:        traderModel?.winRate ?? null,
      expectancyR:    traderModel?.expectancyR ?? null,
      profitFactor:   traderModel?.profitFactor ?? null,
      n:              traderModel?.totalClosedTrades ?? 0,
      behavioralFlags:(traderModel?.behavioralFlags as Array<{ flag: string; evidence: string; sampleSize: number }>) ?? [],
      statsBySetup:   (traderModel?.statsBySetup as Record<string, unknown>) ?? {},
      statsAfterLoss: (traderModel?.statsAfterLoss as Record<string, unknown>) ?? {},
    },
    context: {
      openTrades,
      yesterdayPnlR:   recentTrades[0]?.rMultiple ?? null,
      streakDays:      psychProfile?.streakDays ?? 0,
      todayTradeCount: todayTrades,
      localTime,
    },
  }

  const marketState = {
    index:      homeIdx,
    regime:     regimeData.current_regime,
    confidence: regimeData.confidence,
    posterior:  regimeData.posterior,
  }

  const traderState = {
    calibrated:     traderModel?.calibrated ?? false,
    expectancyR:    traderModel?.expectancyR ?? null,
    totalTrades:    traderModel?.totalClosedTrades ?? 0,
    openTrades,
    streak:         psychProfile?.streakDays ?? 0,
    todayTradeCount: todayTrades,
  }

  // Generate via AI (Claude when keyed, else Azure)
  let directive: Record<string, unknown> = {}
  try {
    const raw     = await routeAITask('synthesis', MIND_DIRECTIVE_PROMPT(inputs))
    const stripped = raw.replace(/```json\n?|```\n?/g, '').trim()
    directive = JSON.parse(stripped)
  } catch {
    directive = {
      headline:          'Market data collected. AI analysis unavailable right now.',
      marketRead:        `Current regime: ${regimeData.current_regime} (${(regimeData.confidence*100).toFixed(0)}% confidence).`,
      personalRead:      traderModel?.calibrated ? `Your expectancy is ${(traderModel.expectancyR??0).toFixed(2)}R.` : 'Your model is still calibrating.',
      todayEV:           'UNKNOWN',
      todayEVReason:     'AI budget may be exhausted. Check back later.',
      greenlightSetups:  [],
      avoidSetups:       [],
      behavioralWatch:   null,
      sizeGuidance:      'NORMAL',
      sizeGuidanceReason:'No AI guidance available.',
      oneRule:           'Stick to your plan.',
    }
  }

  type J = Parameters<typeof db.mindDirective.create>[0]['data']['directive']
  const j = (v: unknown): J => v as J

  await db.mindDirective.upsert({
    where:  { userId_directiveDate: { userId, directiveDate: today } },
    create: { userId, directiveDate: today, marketState: j(marketState), traderState: j(traderState), directive: j(directive) },
    update: { marketState: j(marketState), traderState: j(traderState), directive: j(directive) },
  })
}

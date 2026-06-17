export interface CopilotContext {
  symbol:          string
  side:            string   // LONG | SHORT
  entryPrice:      number
  quantity:        number
  stopLoss:        number | null
  targetPrice:     number | null
  currentPrice:    number
  pnlPct:          number
  pnlDollar:       number
  durationMinutes: number
  // Live price data from Yahoo Finance
  high:     number
  low:      number
  open:     number
  volume:   number
  avgVolume: number
  ema20:    number
  vwap:     number
  rsi:      number
  changePct: number
}

export interface BehavioralContext extends CopilotContext {
  dominantBias:       string
  totalEntries:       number
  recentEmotions:     string
  streakDays:         number
  // Mind Engine fusion — top 2 behavioral flags + streak stats + today's EV
  topFlags:           Array<{ flag: string; evidence: string }> | null
  statsAfterLoss:     string | null  // stringified condensed stats
  todayEV:            string | null  // POSITIVE|NEGATIVE|NEUTRAL|UNKNOWN
}

const c = (ctx: CopilotContext) =>
  `${ctx.symbol} ${ctx.side} | Entry $${ctx.entryPrice} | Now $${ctx.currentPrice} | P&L ${ctx.pnlPct.toFixed(2)}% ($${ctx.pnlDollar.toFixed(2)}) | ${ctx.durationMinutes}min in trade`

export const COPILOT_PROMPTS = {

  // ---------------------------------------------------------------------------
  // Agent A — TECHNICAL  (Azure OpenAI GPT-4o)
  // ---------------------------------------------------------------------------
  TECHNICAL: (ctx: CopilotContext) => `You are a quantitative technical analyst monitoring a live trade.
Respond ONLY with the JSON object below. No markdown. No explanation.

TRADE: ${c(ctx)}
Stop: ${ctx.stopLoss ?? 'none'} | Target: ${ctx.targetPrice ?? 'none'}

LIVE PRICE DATA:
O:${ctx.open} H:${ctx.high} L:${ctx.low} | Vol:${ctx.volume.toLocaleString()} vs Avg:${ctx.avgVolume.toLocaleString()}
EMA20:$${ctx.ema20.toFixed(2)} VWAP:$${ctx.vwap.toFixed(2)} RSI:${ctx.rsi}
Change today: ${ctx.changePct.toFixed(2)}%

{
  "overallBias": "BULLISH",
  "biasStrength": 0,
  "keyLevels": {
    "support1": 0, "support2": 0,
    "resistance1": 0, "resistance2": 0,
    "vwap": ${ctx.vwap.toFixed(2)},
    "ema20": ${ctx.ema20.toFixed(2)}
  },
  "momentum": { "rsi14": ${ctx.rsi}, "macdBias": "BULLISH", "adxStrength": 0 },
  "volatility": { "atr14": 0, "bbSqueeze": false },
  "volume": { "vsAverage": "NORMAL", "cumulativeDelta": "NEUTRAL" },
  "priceVsVwap": "ABOVE",
  "priceVsEma20": "ABOVE",
  "immediateAlert": null,
  "summary": "2-sentence plain English technical read."
}
overallBias: BULLISH|BEARISH|NEUTRAL
macdBias: BULLISH|BEARISH|NEUTRAL
cumulativeDelta: BUYING|SELLING|NEUTRAL
priceVsVwap: ABOVE|BELOW|AT
priceVsEma20: ABOVE|BELOW|AT`,

  // ---------------------------------------------------------------------------
  // Agent B — INSTITUTIONAL FLOW  (Claude)
  // ---------------------------------------------------------------------------
  INSTITUTIONAL: (ctx: CopilotContext) => `You are an institutional flow analyst.
No FlowAlgo data available — reason from price action, volume, and options market context.
Respond ONLY with the JSON object below. No markdown. No explanation.

TRADE: ${c(ctx)}
Volume vs average: ${ctx.volume > ctx.avgVolume * 1.5 ? 'HIGH (1.5x+)' : ctx.volume < ctx.avgVolume * 0.7 ? 'LOW' : 'NORMAL'}

{
  "institutionalBias": "NEUTRAL",
  "confidenceScore": 0,
  "darkPoolSignal": "UNCLEAR",
  "optionsFlowSignal": "NEUTRAL",
  "gammaEnvironment": "NEUTRAL",
  "smartMoneyVsPosition": "NEUTRAL",
  "keyInsight": "2-sentence most important institutional observation.",
  "urgentAlert": null,
  "riskToPosition": "LOW"
}
institutionalBias: BULLISH|BEARISH|NEUTRAL|MIXED
darkPoolSignal: ACCUMULATING|DISTRIBUTING|NEUTRAL|UNCLEAR
optionsFlowSignal: AGGRESSIVELY_BULLISH|BULLISH|NEUTRAL|BEARISH|AGGRESSIVELY_BEARISH
gammaEnvironment: PINNING|ACCELERATING|NEUTRAL
smartMoneyVsPosition: ALIGNED|OPPOSED|NEUTRAL
riskToPosition: LOW|MEDIUM|HIGH|CRITICAL`,

  // ---------------------------------------------------------------------------
  // Agent C — DARK POOL  (Claude)
  // ---------------------------------------------------------------------------
  DARK_POOL: (ctx: CopilotContext) => `You are a dark pool analyst. No live dark pool feed — reason from volume anomalies and price behavior.
Respond ONLY with the JSON object below. No markdown. No explanation.

TRADE: ${c(ctx)}
Today volume: ${ctx.volume.toLocaleString()} | 30d avg: ${ctx.avgVolume.toLocaleString()}
Volume ratio: ${(ctx.volume / Math.max(ctx.avgVolume, 1)).toFixed(2)}x
Price moved ${ctx.changePct.toFixed(2)}% on this volume profile.

{
  "signal": "NEUTRAL",
  "institutionalActivity": "UNCLEAR",
  "significanceLevel": "LOW",
  "volumeAnomaly": false,
  "keyInsight": "2-sentence observation about what volume and price behavior suggests.",
  "urgentAlert": null
}
signal: BULLISH|BEARISH|NEUTRAL|UNCLEAR
institutionalActivity: ACCUMULATING|DISTRIBUTING|NEUTRAL|UNCLEAR
significanceLevel: LOW|MEDIUM|HIGH`,

  // ---------------------------------------------------------------------------
  // Agent D — SOCIAL & NARRATIVE  (Grok)
  // ---------------------------------------------------------------------------
  SOCIAL: (ctx: CopilotContext) => `Search X/Twitter right now for discussion about ${ctx.symbol}.
A trader is ${ctx.side} since $${ctx.entryPrice} and is currently at ${ctx.pnlPct.toFixed(2)}% P&L.

Find:
1. What are traders and analysts saying about ${ctx.symbol} right now?
2. Is there any breaking news or viral narrative?
3. Any coordinated pump or panic behavior?
4. Dominant emotion: fear, greed, euphoria, panic?
5. Are large verified accounts posting? What are they saying?

Respond ONLY with valid JSON. No markdown. No explanation.
{
  "xSentiment": "NEUTRAL",
  "sentimentScore": 0.0,
  "dominantEmotion": "CALM",
  "breakingNarrative": null,
  "pumpOrPanicDetected": false,
  "retailFOMOLevel": 0,
  "contrarianSignal": null,
  "summary": "2-sentence social intelligence read.",
  "urgentAlert": null
}
xSentiment: VERY_BULLISH|BULLISH|NEUTRAL|BEARISH|VERY_BEARISH
dominantEmotion: FEAR|GREED|UNCERTAINTY|EUPHORIA|PANIC|CALM
sentimentScore: -1.0 to 1.0`,

  // ---------------------------------------------------------------------------
  // Agent E-1 — FUNDAMENTAL NEWS  (Perplexity — step 1 of 2)
  // ---------------------------------------------------------------------------
  FUNDAMENTAL_NEWS: (ctx: CopilotContext) =>
    `Search for breaking news and developments about ${ctx.symbol} in the last 4 hours.
A trader is currently ${ctx.side} at $${ctx.entryPrice}. Current price: $${ctx.currentPrice}.
Return only verified facts with source references. Flag unverified rumors.
Focus on: earnings, analyst moves, regulatory news, sector events, macro factors.`,

  // ---------------------------------------------------------------------------
  // Agent E-2 — FUNDAMENTAL SYNTHESIS  (Claude — step 2 of 2)
  // ---------------------------------------------------------------------------
  FUNDAMENTAL_SYNTHESIS: (ctx: CopilotContext, newsContext: string) =>
    `You are a fundamental analyst providing context on a live trade.
Respond ONLY with the JSON object below. No markdown. No explanation.

TRADE: ${c(ctx)}
VERIFIED NEWS CONTEXT:
${newsContext}

{
  "fundamentalBias": "NEUTRAL",
  "catalystRisk": "LOW",
  "upcomingCatalysts": [],
  "newsImpactOnPosition": "NEUTRAL",
  "keyInsight": "2-sentence fundamental context for this specific trade.",
  "urgentAlert": null
}
fundamentalBias: BULLISH|BEARISH|NEUTRAL
catalystRisk: LOW|MEDIUM|HIGH|CRITICAL
newsImpactOnPosition: POSITIVE|NEGATIVE|NEUTRAL`,

  // ---------------------------------------------------------------------------
  // Agent F — BEHAVIORAL MONITOR  (Claude)
  // ---------------------------------------------------------------------------
  BEHAVIORAL: (ctx: BehavioralContext) => `You are a trading psychologist monitoring a retail trader in real time.
This is not generic advice — respond to what is actually happening in this trade.
Respond ONLY with the JSON object below. No markdown. No explanation.

TRADER PROFILE (from journal history):
- Dominant bias: ${ctx.dominantBias}
- Journal entries analyzed: ${ctx.totalEntries}
- Recent emotion patterns: ${ctx.recentEmotions || 'none yet'}
- Journaling streak: ${ctx.streakDays} days${ctx.topFlags && ctx.topFlags.length > 0 ? `

VERIFIED BEHAVIORAL FLAGS (from TraderModel — cite these specifically):
${ctx.topFlags.map((f, i) => `${i + 1}. ${f.flag}: ${f.evidence}`).join('\n')}` : ''}${ctx.statsAfterLoss ? `

AFTER-LOSS STATS: ${ctx.statsAfterLoss}` : ''}${ctx.todayEV ? `

TODAY'S MIND DIRECTIVE EV: ${ctx.todayEV}` : ''}

CURRENT SITUATION:
- ${ctx.symbol} ${ctx.side} | Entry $${ctx.entryPrice} | Now $${ctx.currentPrice}
- P&L: ${ctx.pnlPct.toFixed(2)}% ($${ctx.pnlDollar.toFixed(2)})
- Time in trade: ${ctx.durationMinutes} minutes
- Stop loss: ${ctx.stopLoss ? '$' + ctx.stopLoss : 'NOT SET — high risk'}
- Target: ${ctx.targetPrice ? '$' + ctx.targetPrice : 'none set'}

{
  "psychState": "CALM_DISCIPLINED",
  "stateScore": 0,
  "likelyNextMistake": "NONE",
  "mistakeProbability": 0,
  "warningMessage": "2-sentence direct message to the trader about what you observe.",
  "recommendedAction": "HOLD_PLAN",
  "historicalPattern": "1 sentence referencing their actual journal patterns.",
  "breathingRoom": "1 sentence of grounding or perspective.",
  "shouldStopTradingToday": false,
  "stopReason": null
}
psychState: CALM_DISCIPLINED|SLIGHTLY_ANXIOUS|EMOTIONALLY_COMPROMISED|HIGH_RISK|TILT
likelyNextMistake: PANIC_SELL|IGNORE_STOP|AVERAGE_DOWN|REVENGE_TRADE|EUPHORIA_HOLD|NONE
recommendedAction: HOLD_PLAN|REVIEW_STOP|CONSIDER_EXIT|EXIT_NOW|CLOSE_PLATFORM`,

  // ---------------------------------------------------------------------------
  // Consensus synthesis  (Claude — runs after all 6 agents complete)
  // ---------------------------------------------------------------------------
  CONSENSUS: (ctx: CopilotContext, perspectives: {
    technical:     string
    institutional: string
    darkPool:      string
    social:        string
    fundamental:   string
    behavioral:    string
  }) => `You are the TradeGuard AI consensus engine.
Six specialized agents have analyzed this live trade. Synthesize their outputs into one verdict.
Respond ONLY with the JSON object below. No markdown. No explanation.

TRADE: ${c(ctx)}
Stop: ${ctx.stopLoss ?? 'none'} | Target: ${ctx.targetPrice ?? 'none'}

AGENT OUTPUTS:
TECHNICAL:     ${perspectives.technical}
INSTITUTIONAL: ${perspectives.institutional}
DARK POOL:     ${perspectives.darkPool}
SOCIAL:        ${perspectives.social}
FUNDAMENTAL:   ${perspectives.fundamental}
BEHAVIORAL:    ${perspectives.behavioral}

{
  "overallSignal": "HOLD_POSITION",
  "consensusSummary": "3-4 sentence paragraph synthesizing all 6 perspectives into one clear verdict for the trader.",
  "stopLossNote": "1 sentence on whether the current stop loss is technically valid.",
  "nextDecisionLevel": 0,
  "alertCount": 0
}
overallSignal: HOLD_POSITION|FAVORABLE_CONDITIONS|ADD_CAUTION|REVIEW_STOP|EXIT_NOW
nextDecisionLevel: the exact price where the trader should reassess (resistance, support, or stop)
alertCount: number of agents that raised an urgentAlert`,
}
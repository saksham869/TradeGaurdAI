import { Position } from '@prisma/client'
import db from '../db'
import { callGrok } from '../ai/grok'
import { callPerplexity } from '../ai/perplexity'
import { callAzureOpenAI } from '../ai/azure-openai'
import { callClaude } from '../ai/claude'
import { getYahooQuote } from '../data/yahoo'
import { pusherServer } from '../pusher-server'
import { COPILOT_PROMPTS, CopilotContext, BehavioralContext } from '../ai/copilot-prompts'
import { getActiveModelName, getOpenAIProviderName } from '../ai/router'

// Every agent reports the model that actually produced its output —
// including fallbacks — so stored labels are always truthful.
type AgentOutput = { text: string; model: string }

// =============================================================================
// Public entry point — called by start and refresh routes
// =============================================================================

export async function runCopilotAnalysis(sessionId: string, position: Position) {
  const session = await db.copilotSession.findUnique({ where: { id: sessionId } })
  if (!session) throw new Error(`CopilotSession ${sessionId} not found`)

  // 1. Live price — fallback to entry price if Yahoo is unavailable
  let priceData: Awaited<ReturnType<typeof getYahooQuote>> | null = null
  try {
    priceData = await getYahooQuote(position.symbol)
  } catch {
    console.warn(`Yahoo Finance unavailable for ${position.symbol} — using entry price`)
  }

  // livePrice is the real market price (null if Yahoo was unavailable) — used for
  // P&L display so a fallback never produces a misleading number.
  const livePrice = priceData?.price ?? null
  const currentPrice = livePrice ?? position.entryPrice
  const pnlPct =
    position.side === 'LONG'
      ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100
      : ((position.entryPrice - currentPrice) / position.entryPrice) * 100
  const pnlDollar =
    position.side === 'LONG'
      ? (currentPrice - position.entryPrice) * position.quantity
      : (position.entryPrice - currentPrice) * position.quantity
  const durationMinutes = Math.floor(
    (Date.now() - new Date(position.openedAt).getTime()) / 60_000
  )

  // 2. Shared context for all agents
  const ctx: CopilotContext = {
    symbol:          position.symbol,
    side:            position.side,
    entryPrice:      position.entryPrice,
    quantity:        position.quantity,
    stopLoss:        position.stopLoss,
    targetPrice:     position.targetPrice,
    currentPrice,
    pnlPct,
    pnlDollar,
    durationMinutes,
    high:      priceData?.high     ?? currentPrice * 1.01,
    low:       priceData?.low      ?? currentPrice * 0.99,
    open:      priceData?.open     ?? currentPrice,
    volume:    priceData?.volume   ?? 0,
    avgVolume: priceData?.avgVolume ?? 0,
    ema20:     priceData?.ema20Approx ?? currentPrice * 0.98,
    vwap:      priceData?.vwapApprox  ?? currentPrice,
    rsi:       priceData?.rsiApprox   ?? 50,
    changePct: priceData?.changePct   ?? 0,
  }

  // 3. Behavioral agent also needs PsychProfile
  const psychProfile = await db.psychProfile.findUnique({
    where: { userId: position.userId },
  })
  const behavCtx: BehavioralContext = {
    ...ctx,
    dominantBias:   psychProfile?.dominantTag ?? 'NEUTRAL',
    totalEntries:   psychProfile?.totalEntries ?? 0,
    recentEmotions: Object.keys(psychProfile?.tagFrequency ?? {}).slice(0, 3).join(', '),
    streakDays:     psychProfile?.streakDays ?? 0,
  }

  // 4. Fire all 6 agents in parallel — allSettled so one failure never kills the rest
  const [techResult, instResult, dpResult, socialResult, fundResult, behavResult] =
    await Promise.allSettled([
      runTechnical(ctx),
      runInstitutional(ctx),
      runDarkPool(ctx),
      runSocial(ctx),
      runFundamental(ctx),
      runBehavioral(behavCtx),
    ])

  const agentResults = [
    { type: 'TECHNICAL',     result: techResult   },
    { type: 'INSTITUTIONAL', result: instResult   },
    { type: 'DARK_POOL',     result: dpResult     },
    { type: 'SOCIAL',        result: socialResult },
    { type: 'FUNDAMENTAL',   result: fundResult   },
    { type: 'BEHAVIORAL',    result: behavResult  },
  ]

  // 5. Parse each agent response — model label comes from the agent itself
  const parsed = agentResults.map(({ type, result }) => {
    const raw   = result.status === 'fulfilled' ? result.value.text  : ''
    const model = result.status === 'fulfilled' ? result.value.model : getOpenAIProviderName()
    const data = parseSafe(raw)
    return {
      type,
      model,
      rawOutput:   data,
      summary:     extractSummary(type, data),
      signal:      extractSignal(type, data),
      alertLevel:  extractAlertLevel(type, data) as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      urgentAlert: data.urgentAlert ?? data.immediateAlert ?? null,
    }
  })

  // 6. Write all 6 perspectives at current refreshIndex
  const perspectives = await Promise.all(
    parsed.map(p =>
      db.copilotPerspective.create({
        data: {
          sessionId,
          refreshIndex: session.refreshCount,
          type:         p.type as any,
          model:        p.model,
          rawOutput:    p.rawOutput,
          summary:      p.summary,
          signal:       p.signal,
          alertLevel:   p.alertLevel,
          urgentAlert:  p.urgentAlert,
        },
      })
    )
  )

  // 7. Consensus synthesis — runs after all 6 to produce the unified verdict
  const consensusRaw = await runConsensus(ctx, parsed).catch(() => '{}')
  const consensus = parseSafe(consensusRaw)

  // 8. Update session with consensus fields
  const updatedSession = await db.copilotSession.update({
    where: { id: sessionId },
    data: {
      overallSignal:     consensus.overallSignal     ?? null,
      consensusSummary:  consensus.consensusSummary  ?? null,
      stopLossNote:      consensus.stopLossNote       ?? null,
      nextDecisionLevel: consensus.nextDecisionLevel  ?? null,
      currentPrice:      livePrice,
      lastRefreshedAt:   new Date(),
    },
  })

  // 9. Merge perspectives into session so frontend always receives a complete object
  const sessionWithPerspectives = { ...updatedSession, perspectives }

  try {
    await pusherServer.trigger(
      `copilot-${position.id}`,
      'copilot-update',
      { positionId: position.id, session: sessionWithPerspectives }
    )
  } catch {
    // Non-blocking — UI will still get data on next poll
  }

  return { session: sessionWithPerspectives, perspectives }
}

// =============================================================================
// Individual agent runners
// =============================================================================

async function runTechnical(ctx: CopilotContext): Promise<AgentOutput> {
  const text = await callAzureOpenAI(COPILOT_PROMPTS.TECHNICAL(ctx))
  return { text, model: getOpenAIProviderName() }
}

async function runInstitutional(ctx: CopilotContext): Promise<AgentOutput> {
  const text = await callAzureOpenAI(COPILOT_PROMPTS.INSTITUTIONAL(ctx))
  return { text, model: getOpenAIProviderName() }
}

async function runDarkPool(ctx: CopilotContext): Promise<AgentOutput> {
  const text = await callAzureOpenAI(COPILOT_PROMPTS.DARK_POOL(ctx))
  return { text, model: getOpenAIProviderName() }
}

async function runSocial(ctx: CopilotContext): Promise<AgentOutput> {
  const prompt = COPILOT_PROMPTS.SOCIAL(ctx)
  try {
    return { text: await callGrok(prompt), model: 'grok' }
  } catch {
    return { text: await callAzureOpenAI(prompt), model: getOpenAIProviderName() }
  }
}

async function runFundamental(ctx: CopilotContext): Promise<AgentOutput> {
  const newsContext = await callPerplexity(COPILOT_PROMPTS.FUNDAMENTAL_NEWS(ctx)).catch(
    () => `No recent news found for ${ctx.symbol}.`
  )
  const text = await callAzureOpenAI(COPILOT_PROMPTS.FUNDAMENTAL_SYNTHESIS(ctx, newsContext))
  return { text, model: getOpenAIProviderName() }
}

async function runBehavioral(ctx: BehavioralContext): Promise<AgentOutput> {
  const text = await callAzureOpenAI(COPILOT_PROMPTS.BEHAVIORAL(ctx))
  return { text, model: getOpenAIProviderName() }
}

async function runConsensus(
  ctx: CopilotContext,
  parsed: { type: string; summary: string }[]
): Promise<string> {
  const get = (type: string) =>
    parsed.find(p => p.type === type)?.summary ?? 'Unavailable'

  const prompt = COPILOT_PROMPTS.CONSENSUS(ctx, {
    technical:     get('TECHNICAL'),
    institutional: get('INSTITUTIONAL'),
    darkPool:      get('DARK_POOL'),
    social:        get('SOCIAL'),
    fundamental:   get('FUNDAMENTAL'),
    behavioral:    get('BEHAVIORAL'),
  })

  // Claude is the 7th (consensus) agent when configured — synthesises across all 6
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await callClaude(prompt)
    } catch {
      return callAzureOpenAI(prompt)
    }
  }
  return callAzureOpenAI(prompt)
}

// =============================================================================
// Helpers
// =============================================================================

function parseSafe(text: string): Record<string, any> {
  try {
    return JSON.parse(text)
  } catch {
    // Try stripping markdown code fences if model misbehaves
    const stripped = text.replace(/```json\n?|```\n?/g, '').trim()
    try {
      return JSON.parse(stripped)
    } catch {
      return {}
    }
  }
}

function extractSummary(type: string, data: Record<string, any>): string {
  const fallback = `${type} analysis unavailable.`
  switch (type) {
    case 'TECHNICAL':     return data.summary     ?? fallback
    case 'INSTITUTIONAL': return data.keyInsight  ?? fallback
    case 'DARK_POOL':     return data.keyInsight  ?? fallback
    case 'SOCIAL':        return data.summary     ?? fallback
    case 'FUNDAMENTAL':   return data.keyInsight  ?? fallback
    case 'BEHAVIORAL':    return data.warningMessage ?? fallback
    default: return fallback
  }
}

function extractSignal(type: string, data: Record<string, any>): string | null {
  switch (type) {
    case 'TECHNICAL':     return data.overallBias        ?? null
    case 'INSTITUTIONAL': return data.institutionalBias  ?? null
    case 'DARK_POOL':     return data.signal             ?? null
    case 'SOCIAL':        return data.xSentiment         ?? null
    case 'FUNDAMENTAL':   return data.fundamentalBias    ?? null
    case 'BEHAVIORAL':    return data.psychState         ?? null
    default: return null
  }
}

function extractAlertLevel(type: string, data: Record<string, any>): string {
  switch (type) {
    case 'TECHNICAL':
      return data.immediateAlert ? 'HIGH' : 'LOW'
    case 'INSTITUTIONAL':
      return mapLevel(data.riskToPosition)
    case 'DARK_POOL':
      return mapLevel(data.significanceLevel)
    case 'SOCIAL':
      return data.urgentAlert ? 'HIGH' : data.pumpOrPanicDetected ? 'MEDIUM' : 'LOW'
    case 'FUNDAMENTAL':
      return mapLevel(data.catalystRisk)
    case 'BEHAVIORAL': {
      const score = Number(data.stateScore ?? 0)
      if (score >= 75) return 'CRITICAL'
      if (score >= 50) return 'HIGH'
      if (score >= 25) return 'MEDIUM'
      return 'LOW'
    }
    default: return 'LOW'
  }
}

function mapLevel(val: string | undefined): string {
  const map: Record<string, string> = {
    LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL',
  }
  return map[val?.toUpperCase() ?? ''] ?? 'LOW'
}
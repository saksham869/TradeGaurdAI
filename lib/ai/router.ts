import { redis } from '../redis'
import { callGrok } from './grok'
import { callPerplexity } from './perplexity'
import { callAzureOpenAI } from './azure-openai'
import { callClaude } from './claude'
import crypto from 'crypto'

const AI_BUDGET_KEY = () => `ai:budget:${new Date().toISOString().slice(0, 10)}`
const AI_BUDGET_TTL = 90_000 // 25h

/**
 * Increment the global daily AI call counter.
 * Returns true when the budget is NOT exceeded (request can proceed).
 * Returns false when the budget is exceeded → caller should degrade to cached-only.
 */
export async function checkAndIncrAIBudget(): Promise<boolean> {
  const budget = parseInt(process.env.AI_DAILY_CALL_BUDGET ?? '5000', 10)
  try {
    const key   = AI_BUDGET_KEY()
    const count = await redis?.incr(key)
    if (count === 1) await redis?.expire(key, AI_BUDGET_TTL)
    return count == null || count <= budget
  } catch {
    return true // Redis unavailable — allow through
  }
}

export async function getAIBudgetStatus(): Promise<{ used: number; budget: number; exceeded: boolean }> {
  const budget = parseInt(process.env.AI_DAILY_CALL_BUDGET ?? '5000', 10)
  try {
    const raw  = await redis?.get(AI_BUDGET_KEY())
    const used = typeof raw === 'number' ? raw : 0
    return { used, budget, exceeded: used >= budget }
  } catch {
    return { used: 0, budget, exceeded: false }
  }
}

export type TaskType =
  | 'news_analysis'
  | 'journal_reflection'
  | 'morning_brief'
  | 'hype_detection'
  | 'news_research'
  | 'math_calculation'
  | 'deep_research'
  | 'synthesis'

export type ActiveModelName =
  | 'azure-gpt-4o'
  | 'github-gpt-4o'
  | 'claude-sonnet'
  | 'grok'
  | 'perplexity'

// The model that the default (OpenAI-compatible) path will actually use,
// based on which keys are configured. Mirrors the order in callAzureOpenAI.
export function getOpenAIProviderName(): ActiveModelName {
  const azureConfigured =
    process.env.AZURE_OPENAI_ENDPOINT &&
    process.env.AZURE_OPENAI_API_KEY &&
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME
  if (azureConfigured) return 'azure-gpt-4o'
  return 'github-gpt-4o'
}

// Returns the real model string for what will actually run for a task,
// given the keys configured right now. Every stored or rendered model
// label must come from here — never hardcode a model name.
export function getActiveModelName(task: TaskType): ActiveModelName {
  const claudeConfigured = !!process.env.ANTHROPIC_API_KEY
  switch (task) {
    case 'journal_reflection':
    case 'synthesis':
      return claudeConfigured ? 'claude-sonnet' : getOpenAIProviderName()
    case 'hype_detection':
      return process.env.XAI_API_KEY ? 'grok' : getOpenAIProviderName()
    case 'news_research':
      return process.env.PERPLEXITY_API_KEY ? 'perplexity' : getOpenAIProviderName()
    default:
      return getOpenAIProviderName()
  }
}

// All AI tasks route through Azure OpenAI (or GitHub Models free fallback).
// Grok and Perplexity are kept for social/news tasks but fall back to Azure if unavailable.
export async function routeAITask(
  task: TaskType,
  prompt: string,
  options?: { maxTokens?: number; bypassCache?: boolean }
): Promise<string> {
  const hash     = crypto.createHash('sha256').update(prompt).digest('hex')
  const cacheKey = `ai:${task}:${hash}`

  if (!options?.bypassCache) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return cached as string
    } catch {
      // Redis unavailable — continue without cache
    }
  }

  // Global daily budget guard — degrade gracefully rather than hard-crash
  const withinBudget = await checkAndIncrAIBudget()
  if (!withinBudget) {
    // Return a cached-only placeholder; routes that rely on caching will find
    // a prior result; routes that don't will receive this sentinel.
    throw new Error('AI_BUDGET_EXCEEDED')
  }

  let responseText = ''

  switch (task) {
    case 'journal_reflection':
    case 'synthesis':
      // Claude for reflective and synthesis tasks when key is present
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          responseText = await callClaude(prompt, options)
        } catch {
          responseText = await callAzureOpenAI(prompt, options)
        }
      } else {
        responseText = await callAzureOpenAI(prompt, options)
      }
      break

    case 'hype_detection':
      // Grok for social/X sentiment — Azure fallback if Grok not configured
      try {
        responseText = await callGrok(prompt)
      } catch {
        responseText = await callAzureOpenAI(prompt, options)
      }
      break

    case 'news_research':
      // Perplexity for verified news with citations — Azure fallback
      try {
        responseText = await callPerplexity(prompt)
      } catch {
        responseText = await callAzureOpenAI(prompt, options)
      }
      break

    default:
      // Everything else: Azure OpenAI GPT-4o (or GitHub Models free fallback)
      responseText = await callAzureOpenAI(prompt, options)
      break
  }

  if (responseText) {
    try {
      let ttl = 60 * 15 // 15 min default
      if (task === 'journal_reflection') ttl = 0           // permanent
      if (task === 'morning_brief')      ttl = 60 * 60 * 24 // 24h

      if (ttl > 0) {
        await redis.set(cacheKey, responseText, { ex: ttl })
      } else {
        await redis.set(cacheKey, responseText)
      }
    } catch {
      // Redis unavailable — skip caching
    }
  }

  return responseText
}
import { redis } from '../redis'
import { callGrok } from './grok'
import { callPerplexity } from './perplexity'
import { callAzureOpenAI } from './azure-openai'
import crypto from 'crypto'

export type TaskType =
  | 'news_analysis'
  | 'journal_reflection'
  | 'morning_brief'
  | 'hype_detection'
  | 'news_research'
  | 'math_calculation'
  | 'deep_research'
  | 'synthesis'

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

  let responseText = ''

  switch (task) {
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
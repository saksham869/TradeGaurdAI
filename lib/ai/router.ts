import { redis } from '../redis'
import { callClaude } from './claude'
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
  | 'math_calculation' // V4: routes to GPT-o3
  | 'deep_research'    // V4: routes to Gemini
  | 'synthesis'

export async function routeAITask(
  task: TaskType,
  prompt: string,
  options?: { maxTokens?: number; bypassCache?: boolean }
): Promise<string> {
  // Generate cache key
  const hash = crypto.createHash('sha256').update(prompt).digest('hex')
  const cacheKey = `ai:${task}:${hash}`

  // Non-negotiable Rule 7: Caching
  if (!options?.bypassCache) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return cached as string
      }
    } catch (err) {
      console.error('Redis Cache Get Error:', err)
    }
  }

  let responseText = ''

  switch (task) {
    case 'news_analysis':
    case 'journal_reflection':
    case 'morning_brief':
    case 'synthesis':
      responseText = await callClaude(prompt, options)
      break
    case 'hype_detection':
      responseText = await callGrok(prompt)
      break
    case 'news_research':
      responseText = await callPerplexity(prompt)
      break
    case 'math_calculation':
      // V4: replace with callGPTo3
      responseText = await callClaude(prompt, options)
      break
    case 'deep_research':
      // Azure OpenAI GPT-4o, fallback to Claude
      try {
        responseText = await callAzureOpenAI(prompt, options)
      } catch (azureErr) {
        console.warn('Azure OpenAI unavailable, falling back to Claude:', azureErr)
        responseText = await callClaude(prompt, options)
      }
      break
    default:
      responseText = await callClaude(prompt, options)
  }

  // Cache response if valid
  if (responseText) {
    try {
      // Setup TTL based on task type or rules
      let ttl = 60 * 15 // 15 mins default
      
      if (task === 'journal_reflection') {
        ttl = 0 // Permanent
      } else if (task === 'morning_brief') {
        ttl = 60 * 60 * 24 // 24h
      }

      if (ttl > 0) {
        await redis.set(cacheKey, responseText, { ex: ttl })
      } else {
        // Permanent
        await redis.set(cacheKey, responseText)
      }
    } catch (err) {
      console.error('Redis Cache Set Error:', err)
    }
  }

  return responseText
}

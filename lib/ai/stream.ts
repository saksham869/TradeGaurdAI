// Canonical streaming helper — first real token-by-token streaming in this app.
// Uses @anthropic-ai/sdk native streaming (already installed, no new deps).
// Vercel AI SDK (ai + @ai-sdk/anthropic) was evaluated but requires zod v4
// while the rest of the project is on zod v3 — avoided to prevent dep conflicts.
// Research Terminal panels could adopt this helper in a future pass
// (currently they render as completed blocks).

import Anthropic from '@anthropic-ai/sdk'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const TRADING_ASSISTANT_SYSTEM = `You are Ask TradeGuard, an embedded AI assistant inside the TradeGuard AI trading platform.
You help retail traders think clearly about positions, risk, market dynamics, and trading psychology.

Rules:
- You are concise and direct. Traders scan fast — no bloated preambles.
- When mentioning specific stock/crypto symbols, format them as $SYMBOL (e.g. $AAPL, $NIFTY, $BTC). The UI auto-renders live price cards for these.
- Always remind the user that you are not a financial advisor and nothing you say is financial advice. Say this once per conversation, not in every message.
- Draw on trading psychology, technical analysis, behavioral biases (FOMO, revenge trading, tilt) where relevant.
- If asked about current prices or real-time data, remind the user to check the Research Terminal or Watchlist for live prices.
- You have context about the platform: Research Terminal (multi-agent ticker analysis), Live Copilot (6-agent position monitor), Trading Journal (behavioral AI coach), Mind Engine (daily directive + trader model), Intelligence Feed (real-time news).`

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

export function streamAssistant(messages: ChatMessage[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          system: TRADING_ASSISTANT_SYSTEM,
          max_tokens: 1024,
          messages,
        })

        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }

        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}

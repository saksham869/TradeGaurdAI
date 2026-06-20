export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/auth'
import db from '@/lib/db'
import { streamAssistant, type ChatMessage } from '@/lib/ai/stream'

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { messages }: { messages: ChatMessage[] } = await req.json()
  if (!messages?.length) {
    return new Response(JSON.stringify({ error: 'No messages provided' }), { status: 400 })
  }

  const lastUserMessage = messages[messages.length - 1]

  // Persist user message (non-blocking)
  if (lastUserMessage?.role === 'user') {
    db.assistantMessage.create({
      data: { userId, role: 'user', content: lastUserMessage.content },
    }).catch(() => {})
  }

  // Buffer full response for DB persistence while streaming to client
  const responseChunks: string[] = []

  const upstreamStream = streamAssistant(messages)
  const [streamForClient, streamForDb] = upstreamStream.tee()

  // Collect and persist assistant response after streaming completes
  ;(async () => {
    try {
      const reader = streamForDb.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        responseChunks.push(decoder.decode(value, { stream: true }))
      }
      const fullText = responseChunks.join('')
      if (fullText) {
        await db.assistantMessage.create({
          data: { userId, role: 'assistant', content: fullText },
        })
      }
    } catch {
      // non-blocking — DB write failure must not affect the stream
    }
  })()

  return new Response(streamForClient, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
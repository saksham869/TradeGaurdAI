import { Position } from '@prisma/client'
import db from '../db'

// Stub — full implementation in Step 3.
// Runs all 6 parallel AI agents for the given session and position,
// writes CopilotPerspective rows, and updates session consensus fields.
export async function runCopilotAnalysis(sessionId: string, position: Position) {
  const session = await db.copilotSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) throw new Error(`CopilotSession ${sessionId} not found`)

  // Step 3 will replace this with 6 parallel agent calls.
  // Returning the session + empty perspectives so routes are callable now.
  return {
    session,
    perspectives: [] as any[],
  }
}
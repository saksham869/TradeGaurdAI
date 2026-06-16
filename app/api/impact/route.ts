import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const [journals, positions, feedEvents, sessions, trapWarnings, riskEntries] =
      await Promise.all([
        db.journalEntry.count(),
        db.trade.count(),
        db.feedEvent.count(),
        db.copilotSession.count(),
        db.feedEvent.count({ where: { retailTrap: true } }),
        db.journalEntry.count({ where: { emotionTag: { in: ['REVENGE', 'PANIC', 'FOMO', 'FEARFUL'] } } }),
      ])

    return NextResponse.json({
      success: true,
      data: { journals, positions, feedEvents, sessions, trapWarnings, riskEntries },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
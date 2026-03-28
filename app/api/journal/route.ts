import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { processJournalEntry } from '@/lib/services/journal.service'
import { getUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const entries = await db.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: entries })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch journal' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { rawText, symbol } = await request.json()

    if (!rawText) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 })
    }

    const entry = await db.journalEntry.create({
      data: {
        userId,
        rawText,
        symbol: symbol || null,
        processingStatus: 'processing'
      }
    })

    // Synch processing for V1
    await processJournalEntry(userId, entry.id, rawText, symbol)

    const updatedEntry = await db.journalEntry.findUnique({ where: { id: entry.id } })

    return NextResponse.json({ success: true, data: updatedEntry || entry })
  } catch (error) {
     console.error('Journal Create Error:', error)
     return NextResponse.json({ success: false, error: 'Failed to save journal' }, { status: 500 })
  }
}

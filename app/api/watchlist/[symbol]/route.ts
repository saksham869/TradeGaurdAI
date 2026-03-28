import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function DELETE(request: NextRequest, { params }: { params: { symbol: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const symbol = params.symbol.toUpperCase()
    
    await db.watchlistItem.deleteMany({
      where: { userId, symbol }
    })

    return NextResponse.json({ success: true, message: 'Removed from watchlist' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to remove from watchlist' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  const dateStr = new Date().toISOString().split('T')[0]
  try {
    const brief = await db.marketBrief.findUnique({
      where: { briefDate: dateStr }
    })
    
    if (!brief) {
       return NextResponse.json({ success: true, data: null, message: 'No brief generated yet for today' })
    }

    return NextResponse.json({ success: true, data: brief })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch market brief' }, { status: 500 })
  }
}

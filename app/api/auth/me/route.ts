import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getUserId()
    return NextResponse.json({ success: true, userId })
  } catch {
    return NextResponse.json({ success: false, userId: null })
  }
}

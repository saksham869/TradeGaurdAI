export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { generateDirective } from '@/lib/services/mindEngine.service'

// Runs at 03:00 UTC Mon-Fri — generates directives for users active in the past 7 days
export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const activeUsers = await db.user.findMany({
    where: {
      OR: [
        { trades:        { some: { entryTime: { gte: since } } } },
        { journals:       { some: { createdAt:  { gte: since } } } },
      ],
    },
    select: { id: true },
  })

  let ok = 0
  let fail = 0

  await Promise.allSettled(
    activeUsers.map(u =>
      generateDirective(u.id)
        .then(() => { ok++ })
        .catch(() => { fail++ })
    )
  )

  return NextResponse.json({ success: true, data: { ok, fail, total: activeUsers.length } })
}

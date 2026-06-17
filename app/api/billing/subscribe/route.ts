export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createSubscription } from '@/lib/payments/razorpay'
import db from '@/lib/db'

export async function POST() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Payment provider not configured' },
      { status: 503 }
    )
  }

  const userId = await requireAuth()

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { razorpayCustomerId: true, plan: true },
    })
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    if (user.plan === 'PRO') {
      return NextResponse.json({ success: false, error: 'Already on PRO plan' }, { status: 400 })
    }

    const { subscriptionId, keyId } = await createSubscription(
      user.razorpayCustomerId ?? undefined
    )

    // Store subscription ID so the webhook can look it up by user
    await db.user.update({
      where: { id: userId },
      data: { razorpaySubId: subscriptionId },
    })

    return NextResponse.json({
      success: true,
      data: { subscriptionId, keyId },
    })
  } catch (error) {
    console.error('Billing subscribe error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create subscription' }, { status: 500 })
  }
}


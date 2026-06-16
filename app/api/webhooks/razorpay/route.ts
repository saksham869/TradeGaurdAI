import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/payments/razorpay'
import db from '@/lib/db'

// Razorpay sends raw body with application/json — must NOT use request.json()
// before reading rawBody, or the body stream will be consumed.
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { event: string; payload: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const subPayload = (event.payload as any)?.subscription?.entity
  const subId: string | undefined = subPayload?.id

  if (!subId) {
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const customerId: string | undefined = subPayload?.customer_id
        await db.user.updateMany({
          where: { razorpaySubId: subId },
          data: {
            plan: 'PRO',
            planUpdatedAt: new Date(),
            ...(customerId ? { razorpayCustomerId: customerId } : {}),
          },
        })
        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired':
      case 'subscription.pending':
      case 'subscription.halted': {
        await db.user.updateMany({
          where: { razorpaySubId: subId },
          data: { plan: 'FREE', planUpdatedAt: new Date() },
        })
        break
      }
    }
  } catch (err) {
    console.error('[razorpay webhook] DB update error:', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
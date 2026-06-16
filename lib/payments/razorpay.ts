import Razorpay from 'razorpay'
import crypto from 'crypto'

function getRazorpayClient(): Razorpay {
  const keyId     = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    throw new Error('[razorpay] RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required')
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

export interface CreateSubscriptionResult {
  subscriptionId: string
  keyId: string
}

/**
 * Creates a Razorpay subscription for the PRO monthly plan.
 * The plan must already exist in the Razorpay dashboard and its ID set in env.
 */
export async function createSubscription(
  customerId?: string
): Promise<CreateSubscriptionResult> {
  const rz      = getRazorpayClient()
  const planId  = process.env.RAZORPAY_PLAN_ID
  if (!planId) throw new Error('[razorpay] RAZORPAY_PLAN_ID is required')

  const params: Parameters<typeof rz.subscriptions.create>[0] = {
    plan_id:     planId,
    total_count: 12,     // auto-renew monthly for 12 cycles then re-subscribe
    quantity:    1,
  }
  if (customerId) {
    // Razorpay SDK types omit customer_id; cast through unknown to set it
    ;(params as unknown as Record<string, unknown>).customer_id = customerId
  }

  const sub = await rz.subscriptions.create(params)
  return {
    subscriptionId: sub.id,
    keyId: process.env.RAZORPAY_KEY_ID!,
  }
}

/**
 * Verifies a Razorpay webhook signature.
 * Returns true when the payload was signed by the configured secret.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
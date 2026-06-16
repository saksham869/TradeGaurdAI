"use client"

import { useState } from 'react'
import { X, Zap, Check } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  reason?: string
}

const PRO_FEATURES = [
  'Unlimited research queries',
  'Unlimited watchlist symbols',
  'Live Copilot (6-agent + consensus)',
  'Mind Engine V7 daily directive',
  'All AI models (Claude + GPT-4o)',
]

export default function UpgradeModal({ open, onClose, reason }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  if (!open) return null

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/billing/subscribe', { method: 'POST' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Failed to start subscription')

      const { subscriptionId, keyId } = json.data

      // Load Razorpay standard checkout script if not already present
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script    = document.createElement('script')
          script.src      = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload   = () => resolve()
          script.onerror  = () => reject(new Error('Failed to load Razorpay'))
          document.head.appendChild(script)
        })
      }

      const rzp = new (window as any).Razorpay({
        key:             keyId,
        subscription_id: subscriptionId,
        name:            'TradeGuard AI',
        description:     'PRO Plan — ₹499/month',
        image:           '/logo.png',
        prefill:         {},
        theme:           { color: '#3B82F6' },
        handler: () => {
          // Webhook will update the plan; close modal and show success state
          onClose()
          window.location.reload()
        },
      })
      rzp.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="glass-card"
        style={{ width: '100%', maxWidth: '400px', padding: '28px', position: 'relative' }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Zap size={20} color="var(--warning)" />
          <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Upgrade to PRO
          </span>
        </div>

        {reason && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
            {reason}
          </p>
        )}

        <div style={{ marginBottom: '20px' }}>
          {PRO_FEATURES.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Check size={14} color="var(--bull)" />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{f}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: 'var(--bg-subtle)', borderRadius: '8px', padding: '12px 16px',
            marginBottom: '20px', textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>₹499</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '6px' }}>/month</span>
        </div>

        {error && (
          <p style={{ fontSize: '12px', color: 'var(--bear)', marginBottom: '12px' }}>{error}</p>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: loading ? 'var(--bg-subtle)' : 'var(--accent-blue)',
            color: loading ? 'var(--text-muted)' : '#fff',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Opening Razorpay…' : 'Subscribe — ₹499/month'}
        </button>

        <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
          Educational analysis, not investment advice. Cancel anytime.
        </p>
      </div>
    </div>
  )
}
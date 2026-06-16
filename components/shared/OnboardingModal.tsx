"use client"

import { useState } from 'react'
import { Star, Search, BookOpen, X, ChevronRight, Check } from 'lucide-react'

const STEPS = [
  {
    icon: Star,
    title: 'Add 3 symbols to your watchlist',
    description: 'Try RELIANCE.NS, AAPL, or BTC — track what matters to you.',
    href: '/watchlist',
    cta: 'Go to Watchlist',
    color: 'var(--warning)',
  },
  {
    icon: Search,
    title: 'Run your first research',
    description: 'Pick any ticker and get 3-agent AI analysis in under 10 seconds.',
    href: '/research',
    cta: 'Open Research',
    color: 'var(--accent-blue)',
  },
  {
    icon: BookOpen,
    title: 'Write your first journal line',
    description: 'One sentence about how you\'re feeling about markets today.',
    href: '/journal',
    cta: 'Open Journal',
    color: 'var(--bull)',
  },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function OnboardingModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState<boolean[]>([false, false, false])

  if (!open) return null

  const current  = STEPS[step]
  const IconComp = current.icon
  const allDone  = done.every(Boolean)

  function markDone() {
    setDone(prev => {
      const next = [...prev]
      next[step] = true
      return next
    })
    if (step < 2) setStep(s => s + 1)
    else onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '28px', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>

        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>
          Welcome to TradeGuard AI · Step {step + 1} of 3
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                flex: 1, height: '3px', borderRadius: '2px',
                background: i <= step ? current.color : 'var(--border-muted)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
            background: `${current.color}15`, border: `1px solid ${current.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconComp size={22} color={current.color} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>{current.title}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{current.description}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href={current.href}
            onClick={markDone}
            style={{
              flex: 1, padding: '11px', borderRadius: '8px', textDecoration: 'none',
              background: current.color, color: '#fff', fontSize: '13px', fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            {current.cta} <ChevronRight size={14} />
          </a>
          {step < 2 && (
            <button
              onClick={() => setStep(s => s + 1)}
              style={{
                padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border-muted)',
                background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
              }}
            >
              Skip
            </button>
          )}
        </div>

        {/* Completed steps */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {STEPS.map((s, i) => done[i] ? (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'var(--bull)' }}>
              <Check size={13} /> {s.title}
            </div>
          ) : null)}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from 'react'
import { Info, Shield, X } from 'lucide-react'

interface Props {
  model:         string
  task:          string
  inputSummary:  string
  safetyPassed?: boolean
  generatedAt?:  string
}

export default function AITransparencyBadge({ model, task, inputSummary, safetyPassed = true, generatedAt }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        title="Why did the AI say this?"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '2px 8px', borderRadius: '4px',
          background: 'rgba(0,120,212,0.08)', color: '#0078D4',
          border: '1px solid rgba(0,120,212,0.2)',
          fontSize: '10px', fontWeight: '600', cursor: 'pointer',
          transition: 'all 0.15s ease', fontFamily: 'JetBrains Mono, monospace',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,120,212,0.15)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,120,212,0.08)' }}
      >
        <Info size={10} /> Why this?
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: '6px',
            width: '320px', zIndex: 1001,
            background: 'var(--bg-elevated)',
            border: '1px solid rgba(0,120,212,0.3)',
            borderRadius: '10px', padding: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            animation: 'slideIn 0.15s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={13} color="#0078D4" />
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#0078D4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Responsible AI
                </span>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
                <X size={12} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Model</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{model}</div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Task Type</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{task}</div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Input Used</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{inputSummary}</div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px',
                borderRadius: '6px',
                background: safetyPassed ? 'var(--bull-dim)' : 'var(--bear-dim)',
                border: `1px solid ${safetyPassed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <Shield size={12} color={safetyPassed ? 'var(--bull)' : 'var(--bear)'} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: safetyPassed ? 'var(--bull)' : 'var(--bear)' }}>
                    Azure Content Safety: {safetyPassed ? 'Passed' : 'Flagged'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Checked for: Hate · SelfHarm · Violence · Sexual
                  </div>
                </div>
              </div>

              {generatedAt && (
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                  Generated: {new Date(generatedAt).toLocaleString()}
                </div>
              )}

              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-muted)', fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                This response was generated by Azure OpenAI and is for informational purposes only. Not financial advice. TradeGuard AI is committed to Microsoft Responsible AI principles.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
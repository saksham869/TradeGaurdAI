"use client"

import { useEffect } from 'react'
import { AlertTriangle, Brain, Shield, Zap } from 'lucide-react'

export interface BehavioralRawOutput {
  psychState:            string
  stateScore:            number
  likelyNextMistake:     string
  warningMessage:        string
  recommendedAction:     string
  breathingRoom:         string
  shouldStopTradingToday: boolean
  stopReason:            string | null
}

interface Props {
  data:         BehavioralRawOutput
  symbol:       string
  onDismiss:    () => void
  onStopTrading: () => void
}

const MISTAKE_LABELS: Record<string, string> = {
  PANIC_SELL:    'Panic Sell',
  IGNORE_STOP:   'Ignore Stop Loss',
  AVERAGE_DOWN:  'Average Down',
  REVENGE_TRADE: 'Revenge Trade',
  EUPHORIA_HOLD: 'Euphoria Hold',
  NONE:          'No Specific Risk',
}

const ACTION_STYLES: Record<string, { color: string; label: string }> = {
  HOLD_PLAN:      { color: 'var(--accent-blue)', label: 'Hold Your Plan' },
  REVIEW_STOP:    { color: 'var(--warning)',      label: 'Review Stop Loss' },
  CONSIDER_EXIT:  { color: 'var(--warning)',      label: 'Consider Exiting' },
  EXIT_NOW:       { color: 'var(--bear)',          label: 'Exit Position Now' },
  CLOSE_PLATFORM: { color: 'var(--bear)',          label: 'Close the Platform' },
}

export default function TiltInterventionModal({ data, symbol, onDismiss, onStopTrading }: Props) {
  const actionStyle = ACTION_STYLES[data.recommendedAction] ?? ACTION_STYLES['HOLD_PLAN']
  const scoreColor =
    data.stateScore >= 75 ? 'var(--bear)' :
    data.stateScore >= 50 ? 'var(--warning)' : 'var(--warning)'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="tilt-modal-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      backdropFilter: 'blur(8px)',
    }}>
      <div className="tilt-modal" style={{
        width: '100%', maxWidth: '520px',
        background: '#0f0808',
        border: '1px solid rgba(239,68,68,0.35)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 0 60px rgba(239,68,68,0.18), 0 0 120px rgba(239,68,68,0.07)',
        animation: 'tiltAppear 0.3s cubic-bezier(0.16,1,0.3,1)',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Pulsing top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.9), transparent)',
          animation: 'tiltPulse 2s ease-in-out infinite',
        }} />

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '24px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'tiltPulse 2s ease-in-out infinite',
          }}>
            <Brain size={22} color="var(--bear)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
              <span style={{
                fontSize: '10px', fontWeight: '800', letterSpacing: '0.14em',
                color: 'var(--bear)', fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
              }}>
                BEHAVIORAL TILT DETECTED
              </span>
              <span style={{
                fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
                background: 'rgba(239,68,68,0.15)', color: scoreColor,
                border: `1px solid rgba(239,68,68,0.3)`,
                fontFamily: 'JetBrains Mono, monospace', fontWeight: '800',
              }}>
                {data.stateScore}/100
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fca5a5', lineHeight: '1.2' }}>
              Emergency Intervention
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', fontFamily: 'JetBrains Mono, monospace' }}>
              {symbol} · AI Behavioral Monitor
            </div>
          </div>
        </div>

        {/* ── Warning message ── */}
        <div style={{
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '10px', padding: '14px 16px', marginBottom: '12px',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: '700', color: 'var(--bear)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <AlertTriangle size={10} /> Behavioral Analysis
          </div>
          <p style={{ fontSize: '13px', color: '#fca5a5', lineHeight: '1.75' }}>
            {data.warningMessage || 'Your trading behavior has entered a high-risk pattern. Stop and assess before your next action.'}
          </p>
        </div>

        {/* ── Predicted next mistake ── */}
        {data.likelyNextMistake && data.likelyNextMistake !== 'NONE' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '8px', padding: '10px 14px', marginBottom: '10px',
          }}>
            <Zap size={13} color="var(--bear)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                Predicted next mistake
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--bear)' }}>
                {MISTAKE_LABELS[data.likelyNextMistake] ?? data.likelyNextMistake.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        )}

        {/* ── AI Recommendation ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: actionStyle.color + '12',
          border: `1px solid ${actionStyle.color}28`,
          borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
        }}>
          <Shield size={13} color={actionStyle.color} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              AI Recommendation
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: actionStyle.color }}>
              {actionStyle.label}
            </div>
          </div>
        </div>

        {/* ── Grounding message ── */}
        <div style={{
          padding: '12px 14px', marginBottom: '24px',
          borderLeft: '3px solid rgba(139,92,246,0.5)',
          background: 'rgba(139,92,246,0.05)',
          borderRadius: '0 8px 8px 0',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: '700', color: 'var(--purple)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px',
          }}>
            Grounding
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7', fontStyle: 'italic' }}>
            {data.breathingRoom || 'Take three slow breaths. The market will still be here in five minutes.'}
          </p>
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.shouldStopTradingToday && (
            <button
              onClick={onStopTrading}
              style={{
                width: '100%', padding: '13px',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: '10px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '700', color: '#fca5a5',
                transition: 'all 0.15s ease', fontFamily: 'inherit',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(239,68,68,0.22)' }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)' }}
            >
              Stop Trading Today — I Acknowledge the Risk
            </button>
          )}
          <button
            onClick={onDismiss}
            style={{
              width: '100%', padding: '11px',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: '10px', cursor: 'pointer',
              fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)',
              transition: 'all 0.15s ease', fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              const b = e.target as HTMLButtonElement
              b.style.borderColor = 'var(--border-active)'
              b.style.color = 'var(--text-secondary)'
            }}
            onMouseLeave={e => {
              const b = e.target as HTMLButtonElement
              b.style.borderColor = 'var(--border-default)'
              b.style.color = 'var(--text-muted)'
            }}
          >
            I understand the risk — continue monitoring
          </button>
        </div>
      </div>
    </div>
  )
}
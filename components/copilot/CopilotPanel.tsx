"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, Play, ChevronDown, ChevronUp, AlertTriangle, Radio, Clock } from 'lucide-react'
import { pusherClient } from '@/lib/pusher-client'

// ─── types ────────────────────────────────────────────────────────────────────

interface Position {
  id: string; symbol: string; side: string; entryPrice: number
  quantity: number; stopLoss: number | null; targetPrice: number | null
  status: string; openedAt: string
}

interface Perspective {
  id: string; type: string; model: string; summary: string
  signal: string | null; alertLevel: string; urgentAlert: string | null
  rawOutput: Record<string, any>
}

interface Session {
  id: string; status: string; refreshCount: number
  overallSignal: string | null; consensusSummary: string | null
  stopLossNote: string | null; nextDecisionLevel: number | null
  lastRefreshedAt: string | null
  perspectives: Perspective[]
}

// ─── constants ────────────────────────────────────────────────────────────────

const PERSPECTIVE_META: Record<string, { label: string; color: string; model: string }> = {
  TECHNICAL:     { label: 'Technical',     color: 'var(--accent-blue)', model: 'Azure GPT-4o' },
  INSTITUTIONAL: { label: 'Institutional', color: 'var(--purple)',      model: 'Claude' },
  DARK_POOL:     { label: 'Dark Pool',     color: 'var(--cyan)',        model: 'Claude' },
  SOCIAL:        { label: 'Social',        color: '#f7931a',            model: 'Grok' },
  FUNDAMENTAL:   { label: 'Fundamental',   color: 'var(--warning)',     model: 'Perplexity + Claude' },
  BEHAVIORAL:    { label: 'Behavioral',    color: 'var(--bull)',        model: 'Claude' },
}

const SIGNAL_ORDER: Record<string, number> = {
  TECHNICAL: 0, INSTITUTIONAL: 1, DARK_POOL: 2,
  SOCIAL: 3, FUNDAMENTAL: 4, BEHAVIORAL: 5,
}

const OVERALL_SIGNAL_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  FAVORABLE_CONDITIONS: { color: 'var(--bull)',         bg: 'var(--bull-dim)',      border: 'rgba(34,197,94,0.25)' },
  HOLD_POSITION:        { color: 'var(--accent-blue)',  bg: 'var(--accent-blue-dim)', border: 'rgba(59,130,246,0.25)' },
  ADD_CAUTION:          { color: 'var(--warning)',      bg: 'var(--warning-dim)',   border: 'rgba(245,158,11,0.25)' },
  REVIEW_STOP:          { color: 'var(--warning)',      bg: 'var(--warning-dim)',   border: 'rgba(245,158,11,0.25)' },
  EXIT_NOW:             { color: 'var(--bear)',         bg: 'var(--bear-dim)',      border: 'rgba(239,68,68,0.25)' },
}

function signalColor(signal: string | null): string {
  if (!signal) return 'var(--text-muted)'
  const s = signal.toUpperCase()
  if (['BULLISH', 'VERY_BULLISH', 'CALM_DISCIPLINED', 'ALIGNED', 'ACCUMULATING', 'FUNDAMENTAL'].includes(s)) return 'var(--bull)'
  if (['BEARISH', 'VERY_BEARISH', 'TILT', 'HIGH_RISK', 'DISTRIBUTING', 'OPPOSED', 'EXIT_NOW'].includes(s)) return 'var(--bear)'
  if (['SLIGHTLY_ANXIOUS', 'EMOTIONALLY_COMPROMISED', 'AGGRESSIVELY_BEARISH', 'ADD_CAUTION', 'REVIEW_STOP'].includes(s)) return 'var(--warning)'
  return 'var(--accent-blue)'
}

function alertLevelColor(level: string): string {
  if (level === 'CRITICAL') return 'var(--bear)'
  if (level === 'HIGH')     return 'var(--warning)'
  if (level === 'MEDIUM')   return '#f7931a'
  return 'var(--text-muted)'
}

function elapsed(iso: string | null): string {
  if (!iso) return '—'
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60)  return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  return `${Math.floor(sec / 3600)}h ago`
}

// ─── Perspective card ──────────────────────────────────────────────────────

function PerspectiveCard({ p }: { p: Perspective }) {
  const [expanded, setExpanded] = useState(false)
  const meta = PERSPECTIVE_META[p.type] ?? { label: p.type, color: 'var(--text-secondary)', model: '' }

  return (
    <div className="glass-card" style={{ padding: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: '700', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {meta.label}
          </span>
          {p.alertLevel !== 'LOW' && (
            <AlertTriangle size={11} color={alertLevelColor(p.alertLevel)} />
          )}
        </div>
        {p.signal && (
          <span style={{
            fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px',
            color: signalColor(p.signal),
            background: signalColor(p.signal) + '18',
            border: `1px solid ${signalColor(p.signal)}33`,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {p.signal.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Model label */}
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }}>
        {meta.model}
      </div>

      {/* Urgent alert */}
      {p.urgentAlert && (
        <div style={{
          background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '6px', padding: '6px 10px', fontSize: '11px',
          color: 'var(--bear)', marginBottom: '8px',
        }}>
          ⚡ {p.urgentAlert}
        </div>
      )}

      {/* Summary */}
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        {p.summary || 'Analysis unavailable.'}
      </p>

      {/* Expand raw output */}
      {Object.keys(p.rawOutput ?? {}).length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '11px', color: 'var(--text-muted)', padding: 0,
          }}
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded ? 'Hide data' : 'View full data'}
        </button>
      )}

      {expanded && (
        <pre style={{
          marginTop: '10px', padding: '10px', borderRadius: '6px',
          background: 'var(--bg-subtle)', fontSize: '10px',
          color: 'var(--text-secondary)', overflowX: 'auto',
          border: '1px solid var(--border-muted)', lineHeight: '1.5',
        }}>
          {JSON.stringify(p.rawOutput, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ─── Main panel ────────────────────────────────────────────────────────────

interface Props { position: Position }

export default function CopilotPanel({ position }: Props) {
  const [session,        setSession]        = useState<Session | null>(null)
  const [analyzing,      setAnalyzing]      = useState(false)
  const [loading,        setLoading]        = useState(true)
  const [tick,           setTick]           = useState(0)          // forces elapsed re-render
  const refreshTimer                        = useRef<NodeJS.Timeout | null>(null)

  // Current price + P&L derived from session or fallback
  const currentPrice = session?.perspectives?.[0]?.rawOutput?.keyLevels?.vwap ?? position.entryPrice
  const duration = Math.floor((Date.now() - new Date(position.openedAt).getTime()) / 60_000)

  // ── load existing session ────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res  = await fetch(`/api/positions/${position.id}`)
        const data = await res.json()
        if (data.success && data.data.session) {
          setSession(data.data.session)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [position.id])

  // ── Pusher subscription ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = pusherClient.subscribe(`copilot-${position.id}`)
    channel.bind('copilot-update', (payload: { session: Session }) => {
      setSession(payload.session)
      setAnalyzing(false)
    })
    return () => { pusherClient.unsubscribe(`copilot-${position.id}`) }
  }, [position.id])

  // ── 60-second auto-refresh while session is ACTIVE ──────────────────────
  useEffect(() => {
    if (session?.status !== 'ACTIVE') return
    refreshTimer.current = setInterval(() => { triggerRefresh() }, 60_000)
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current) }
  }, [session?.status])

  // ── tick every second for "X ago" label ──────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // ── actions ──────────────────────────────────────────────────────────────
  async function startCopilot() {
    setAnalyzing(true)
    try {
      const res  = await fetch(`/api/positions/${position.id}/copilot/start`, { method: 'POST' })
      const data = await res.json()
      if (data.success) setSession(data.data.session)
    } finally {
      setAnalyzing(false)
    }
  }

  const triggerRefresh = useCallback(async () => {
    setAnalyzing(true)
    try {
      const res  = await fetch(`/api/positions/${position.id}/copilot/refresh`, { method: 'POST' })
      const data = await res.json()
      if (data.success) setSession(data.data.session)
    } finally {
      setAnalyzing(false)
    }
  }, [position.id])

  // ── perspective sort order ────────────────────────────────────────────────
  const perspectives = [...(session?.perspectives ?? [])].sort(
    (a, b) => (SIGNAL_ORDER[a.type] ?? 99) - (SIGNAL_ORDER[b.type] ?? 99)
  )

  const overallStyle = OVERALL_SIGNAL_STYLE[session?.overallSignal ?? ''] ?? OVERALL_SIGNAL_STYLE['HOLD_POSITION']

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)', fontSize: '13px', gap: '8px' }}>
        <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
        Loading copilot...
      </div>
    )
  }

  return (
    <div>
      {/* ── Position header ── */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Left: identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {position.symbol}
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '5px',
                  background: position.side === 'LONG' ? 'var(--bull-dim)' : 'var(--bear-dim)',
                  color: position.side === 'LONG' ? 'var(--bull)' : 'var(--bear)',
                  border: `1px solid ${position.side === 'LONG' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                }}>
                  {position.side}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: '3px' }}>
                Entry ${position.entryPrice.toFixed(2)}
                {position.stopLoss && <span style={{ color: 'var(--bear)' }}> · Stop ${position.stopLoss.toFixed(2)}</span>}
                {position.targetPrice && <span style={{ color: 'var(--bull)' }}> · Target ${position.targetPrice.toFixed(2)}</span>}
              </div>
            </div>
          </div>

          {/* Right: status + controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {session?.status === 'ACTIVE' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                <Clock size={11} />
                {elapsed(session.lastRefreshedAt)}
              </div>
            )}

            {session?.status === 'ACTIVE' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div className="pulse-dot" />
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--bull)' }}>LIVE</span>
              </div>
            )}

            {analyzing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--accent-blue)' }}>
                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing...
              </div>
            )}

            {!session && !analyzing && (
              <button className="btn-primary" onClick={startCopilot} style={{ gap: '6px' }}>
                <Play size={13} /> Start Analysis
              </button>
            )}

            {session?.status === 'ACTIVE' && !analyzing && (
              <button className="btn-ghost" onClick={triggerRefresh} style={{ gap: '6px', padding: '6px 12px', fontSize: '12px' }}>
                <RefreshCw size={12} /> Refresh Now
              </button>
            )}
          </div>
        </div>

        {/* Trade stats row */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-muted)' }}>
          {[
            { label: 'Time in Trade', value: `${duration}m` },
            { label: 'Qty', value: position.quantity.toString() },
            { label: 'Refresh #', value: session ? `${session.refreshCount}` : '—' },
            { label: 'Agents', value: session ? `${perspectives.length}/6` : '0/6' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── No session yet ── */}
      {!session && !analyzing && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '60px 20px', gap: '12px',
        }}>
          <Radio size={32} color="var(--text-muted)" />
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Copilot not started</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '320px' }}>
            Click "Start Analysis" to fire all 6 AI agents simultaneously and get your live trading intelligence panel.
          </div>
          <button className="btn-primary" onClick={startCopilot} style={{ marginTop: '8px' }}>
            <Play size={13} /> Start Analysis
          </button>
        </div>
      )}

      {/* ── Analyzing spinner ── */}
      {analyzing && perspectives.length === 0 && (
        <div style={{ padding: '40px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '100%' }}>
              {Object.entries(PERSPECTIVE_META).map(([type, meta]) => (
                <div key={type} className="glass-card" style={{ padding: '14px', opacity: 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color }} />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta.label}</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '60%', background: meta.color + '40', animation: 'shimmer 1.5s infinite' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
              6 agents running in parallel — Azure GPT-4o · Claude · Grok · Perplexity
            </div>
          </div>
        </div>
      )}

      {/* ── 6 agent cards grid ── */}
      {perspectives.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
          {perspectives.map(p => <PerspectiveCard key={p.id} p={p} />)}
        </div>
      )}

      {/* ── Consensus block ── */}
      {session?.consensusSummary && (
        <div className="glass-card" style={{
          padding: '20px',
          border: `1px solid ${overallStyle.border}`,
          background: overallStyle.bg + '60',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Copilot Consensus · {perspectives.length}/6 agents
            </div>
            {session.overallSignal && (
              <span style={{
                fontSize: '12px', fontWeight: '800', padding: '4px 12px', borderRadius: '6px',
                color: overallStyle.color, background: overallStyle.bg,
                border: `1px solid ${overallStyle.border}`,
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
              }}>
                {session.overallSignal.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.7', marginBottom: '14px' }}>
            {session.consensusSummary}
          </p>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {session.stopLossNote && (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Stop Loss</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{session.stopLossNote}</div>
              </div>
            )}
            {session.nextDecisionLevel && (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Next Decision At</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  ${session.nextDecisionLevel.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, Play, ChevronDown, ChevronUp, AlertTriangle, Radio, Clock, X, DollarSign, Zap } from 'lucide-react'
import { pusherClient } from '@/lib/pusher-client'
import TiltInterventionModal from './TiltInterventionModal'
import type { BehavioralRawOutput } from './TiltInterventionModal'

// Demo payload — fires the TILT modal on demand during hackathon presentation
const DEMO_TILT_DATA: BehavioralRawOutput = {
  psychState:             'TILT',
  stateScore:             87,
  likelyNextMistake:      'REVENGE_TRADE',
  warningMessage:         'You\'ve been in this trade for 47 minutes and are down 2.1%. Your journal history shows you revenge trade after losses exceeding 1.5%. You are exhibiting the exact pattern that cost you $1,400 last month — emotional decision-making under drawdown pressure.',
  recommendedAction:      'CLOSE_PLATFORM',
  breathingRoom:          'This trade does not define you. One loss is not a disaster. The market will still be here tomorrow — your capital needs to be too.',
  shouldStopTradingToday: true,
  stopReason:             'Behavioral score 87/100 — highest risk state. Stopping now preserves capital and prevents cascading losses.',
}

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
  currentPrice: number | null
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
  FAVORABLE_CONDITIONS: { color: 'var(--bull)',         bg: 'var(--bull-dim)',        border: 'rgba(34,197,94,0.25)' },
  HOLD_POSITION:        { color: 'var(--accent-blue)',  bg: 'var(--accent-blue-dim)', border: 'rgba(59,130,246,0.25)' },
  ADD_CAUTION:          { color: 'var(--warning)',      bg: 'var(--warning-dim)',     border: 'rgba(245,158,11,0.25)' },
  REVIEW_STOP:          { color: 'var(--warning)',      bg: 'var(--warning-dim)',     border: 'rgba(245,158,11,0.25)' },
  EXIT_NOW:             { color: 'var(--bear)',         bg: 'var(--bear-dim)',        border: 'rgba(239,68,68,0.25)' },
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
  if (sec < 60)   return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m ago`
}

function timeInTrade(openedAt: string): string {
  const sec = Math.floor((Date.now() - new Date(openedAt).getTime()) / 1000)
  if (sec < 60)   return `${sec}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}m`
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// A persisted price older than this is considered stale — P&L shows "—" rather
// than a number that no longer reflects the market.
const STALE_PRICE_MS = 5 * 60_000

function clockTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

// ─── Perspective card ──────────────────────────────────────────────────────

function PerspectiveCard({ p }: { p: Perspective }) {
  const [expanded, setExpanded] = useState(false)
  const meta = PERSPECTIVE_META[p.type] ?? { label: p.type, color: 'var(--text-secondary)', model: '' }

  return (
    <div className="glass-card" style={{ padding: '14px' }}>
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

      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }}>
        {meta.model}
      </div>

      {p.urgentAlert && (
        <div style={{
          background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '6px', padding: '6px 10px', fontSize: '11px',
          color: 'var(--bear)', marginBottom: '8px',
        }}>
          ⚡ {p.urgentAlert}
        </div>
      )}

      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        {p.summary || 'Analysis unavailable.'}
      </p>

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

interface Props {
  position: Position
  onPositionUpdate?: (updated: any) => void
}

export default function CopilotPanel({ position, onPositionUpdate }: Props) {
  const [session,                setSession]                = useState<Session | null>(null)
  const [analyzing,              setAnalyzing]              = useState(false)
  const [loading,                setLoading]                = useState(true)
  const [tick,                   setTick]                   = useState(0)
  const [tiltDismissedAtRefresh, setTiltDismissedAtRefresh] = useState<number | null>(null)
  const [demoTilt,               setDemoTilt]               = useState(false)
  const [showCloseForm,          setShowCloseForm]          = useState(false)
  const [exitPrice,              setExitPrice]              = useState('')
  const [closing,                setClosing]                = useState(false)
  const [closeError,             setCloseError]             = useState('')
  const refreshTimer                                        = useRef<NodeJS.Timeout | null>(null)

  const isClosed = position.status === 'CLOSED'

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
    if (session?.status !== 'ACTIVE' || isClosed) return
    refreshTimer.current = setInterval(() => { triggerRefresh() }, 60_000)
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current) }
  }, [session?.status, isClosed])

  // ── tick every second for elapsed labels ─────────────────────────────────
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

  async function handleClosePosition() {
    const price = parseFloat(exitPrice)
    if (!exitPrice || isNaN(price) || price <= 0) {
      setCloseError('Enter a valid exit price.')
      return
    }
    setCloseError('')
    setClosing(true)
    try {
      const res = await fetch(`/api/positions/${position.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED', exitPrice: price }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCloseForm(false)
        onPositionUpdate?.(data.data)
      } else {
        setCloseError(data.error || 'Failed to close position.')
      }
    } catch {
      setCloseError('Network error — please try again.')
    } finally {
      setClosing(false)
    }
  }

  // ── derived values ────────────────────────────────────────────────────────
  const perspectives = [...(session?.perspectives ?? [])].sort(
    (a, b) => (SIGNAL_ORDER[a.type] ?? 99) - (SIGNAL_ORDER[b.type] ?? 99)
  )

  // Live P&L from the price the service captured at analysis time. null/≤0 means
  // Yahoo was unavailable; a price older than STALE_PRICE_MS is treated as stale.
  // In either case P&L renders "—" instead of a misleading number.
  const priceAsOf        = session?.lastRefreshedAt ?? null
  const priceStale       = priceAsOf ? (Date.now() - new Date(priceAsOf).getTime()) > STALE_PRICE_MS : true
  const livePrice        = session?.currentPrice != null && session.currentPrice > 0 ? session.currentPrice : null
  const hasLivePrice     = livePrice !== null && !priceStale
  const hasPriceData     = session !== null && perspectives.length > 0
  const pnlDollar        = hasLivePrice
    ? (position.side === 'LONG'
        ? (livePrice! - position.entryPrice) * position.quantity
        : (position.entryPrice - livePrice!) * position.quantity)
    : null
  const pnlPct           = hasLivePrice
    ? (position.side === 'LONG'
        ? ((livePrice! - position.entryPrice) / position.entryPrice) * 100
        : ((position.entryPrice - livePrice!) / position.entryPrice) * 100)
    : null
  const pnlPositive      = (pnlDollar ?? 0) >= 0
  const pnlColor         = pnlPositive ? 'var(--bull)' : 'var(--bear)'

  const overallStyle = OVERALL_SIGNAL_STYLE[session?.overallSignal ?? ''] ?? OVERALL_SIGNAL_STYLE['HOLD_POSITION']

  // Behavioral state
  const behavioralPerspective   = perspectives.find(p => p.type === 'BEHAVIORAL')
  const psychState              = behavioralPerspective?.signal ?? null
  const isTilt                  = psychState === 'TILT'
  const isHighRisk              = psychState === 'HIGH_RISK' || psychState === 'EMOTIONALLY_COMPROMISED'
  const currentRefresh          = session?.refreshCount ?? 0
  const showTiltModal           = isTilt && (tiltDismissedAtRefresh === null || currentRefresh > tiltDismissedAtRefresh)
  const behavioralData          = behavioralPerspective?.rawOutput as BehavioralRawOutput | undefined

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
      {/* ── TILT Emergency Intervention Modal (real) ── */}
      {showTiltModal && behavioralData && !demoTilt && (
        <TiltInterventionModal
          data={behavioralData}
          symbol={position.symbol}
          onDismiss={() => setTiltDismissedAtRefresh(currentRefresh)}
          onStopTrading={() => setTiltDismissedAtRefresh(currentRefresh)}
        />
      )}

      {/* ── TILT Demo Modal ── */}
      {demoTilt && (
        <TiltInterventionModal
          data={DEMO_TILT_DATA}
          symbol={position.symbol}
          onDismiss={() => setDemoTilt(false)}
          onStopTrading={() => setDemoTilt(false)}
        />
      )}

      {/* ── Position header ── */}
      <div className="glass-card" style={{ padding: '18px 20px', marginBottom: '12px' }}>

        {/* Row 1: Symbol + side + P&L + controls */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>

          {/* Left: identity + P&L */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            {/* Symbol */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
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
                {isClosed && (
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '5px', background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-muted)' }}>
                    CLOSED
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                Entry ${position.entryPrice.toFixed(2)}
                {position.stopLoss   && <span style={{ color: 'var(--bear)' }}> · Stop ${position.stopLoss.toFixed(2)}</span>}
                {position.targetPrice && <span style={{ color: 'var(--bull)' }}> · Target ${position.targetPrice.toFixed(2)}</span>}
              </div>
            </div>

            {/* P&L block — only show when we have analysis data */}
            {hasPriceData && (
              <div style={{
                padding: '8px 14px', borderRadius: '10px',
                background: hasLivePrice ? (pnlPositive ? 'var(--bull-dim)' : 'var(--bear-dim)') : 'var(--bg-subtle)',
                border: `1px solid ${hasLivePrice ? (pnlPositive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : 'var(--border-muted)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    P&L
                  </span>
                  {hasLivePrice && (
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      as of {clockTime(priceAsOf)}
                    </span>
                  )}
                </div>
                {hasLivePrice ? (
                  <>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: pnlColor, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                      {pnlPositive ? '+' : ''}{pnlDollar!.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: pnlColor, marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {pnlPositive ? '+' : ''}{pnlPct!.toFixed(2)}% · ${livePrice!.toFixed(2)}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                      —
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Live price unavailable
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: status + controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

            {!session && !analyzing && !isClosed && (
              <button className="btn-primary" onClick={startCopilot} style={{ gap: '6px' }}>
                <Play size={13} /> Start Analysis
              </button>
            )}

            {session?.status === 'ACTIVE' && !analyzing && (
              <button className="btn-ghost" onClick={triggerRefresh} style={{ gap: '6px', padding: '6px 12px', fontSize: '12px' }}>
                <RefreshCw size={12} /> Refresh
              </button>
            )}

            {/* Demo TILT button — for hackathon presentation */}
            <button
              onClick={() => setDemoTilt(true)}
              title="Demo: trigger TILT intervention modal"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '5px 10px', borderRadius: '7px',
                border: '1px solid rgba(139,92,246,0.3)',
                background: 'rgba(139,92,246,0.08)', color: 'var(--purple)',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={11} /> Demo TILT
            </button>

            {!isClosed && !showCloseForm && (
              <button
                onClick={() => { setShowCloseForm(true); setExitPrice((livePrice ?? position.entryPrice).toFixed(2)) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)',
                  background: 'var(--bear-dim)', color: 'var(--bear)',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <X size={12} /> Close Trade
              </button>
            )}
          </div>
        </div>

        {/* Close trade inline form */}
        {showCloseForm && !isClosed && (
          <div style={{
            marginTop: '14px', paddingTop: '14px',
            borderTop: '1px solid var(--border-muted)',
            display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
          }}>
            <DollarSign size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Exit Price</span>
            <input
              type="number"
              step="any"
              placeholder="Enter exit price"
              value={exitPrice}
              onChange={e => { setExitPrice(e.target.value); setCloseError('') }}
              style={{
                padding: '6px 10px', borderRadius: '7px', width: '140px',
                background: 'var(--bg-subtle)', color: 'var(--text-primary)',
                border: closeError ? '1px solid var(--bear)' : '1px solid var(--border-default)',
                fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', outline: 'none',
              }}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleClosePosition() }}
            />
            <button
              onClick={handleClosePosition}
              disabled={closing}
              style={{
                padding: '6px 14px', borderRadius: '7px',
                background: 'var(--bear)', color: 'white', border: 'none',
                fontSize: '12px', fontWeight: '700', cursor: closing ? 'not-allowed' : 'pointer',
                opacity: closing ? 0.6 : 1,
              }}
            >
              {closing ? 'Closing...' : 'Confirm Exit'}
            </button>
            <button
              onClick={() => { setShowCloseForm(false); setCloseError('') }}
              style={{ padding: '6px 12px', borderRadius: '7px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-muted)', fontSize: '12px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            {closeError && <span style={{ fontSize: '12px', color: 'var(--bear)' }}>{closeError}</span>}
          </div>
        )}

        {/* Row 2: trade stats */}
        <div style={{
          display: 'flex', gap: '20px', flexWrap: 'wrap',
          marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-muted)',
        }}>
          {[
            { label: 'Time in Trade',  value: timeInTrade(position.openedAt) },
            { label: 'Quantity',       value: position.quantity.toString() },
            { label: 'Refresh Count',  value: session ? `#${session.refreshCount}` : '—' },
            { label: 'Agents',         value: session ? `${perspectives.length}/6` : '0/6' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── No session yet ── */}
      {!session && !analyzing && !isClosed && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '60px 20px', gap: '12px',
        }}>
          <Radio size={32} color="var(--text-muted)" />
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Copilot not started</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '320px' }}>
            Click Start Analysis to fire all 6 AI agents simultaneously and get your live trading intelligence panel.
          </div>
          <button className="btn-primary" onClick={startCopilot} style={{ marginTop: '8px' }}>
            <Play size={13} /> Start Analysis
          </button>
        </div>
      )}

      {/* ── Closed position placeholder ── */}
      {isClosed && !session && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: '8px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Position closed — no active copilot session.</div>
        </div>
      )}

      {/* ── Analyzing spinner ── */}
      {analyzing && perspectives.length === 0 && (
        <div style={{ padding: '32px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '100%' }}>
              {Object.entries(PERSPECTIVE_META).map(([type, meta]) => (
                <div key={type} className="glass-card" style={{ padding: '14px', opacity: 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color }} />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta.label}</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                    <div className="skeleton" style={{ height: '100%', width: '100%' }} />
                  </div>
                  <div className="skeleton" style={{ height: '32px', borderRadius: '4px', marginTop: '8px' }} />
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

      {/* ── HIGH_RISK behavioral banner ── */}
      {isHighRisk && !isTilt && behavioralData && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '10px', padding: '12px 14px', marginBottom: '12px',
          animation: 'slideIn 0.3s ease',
        }}>
          <AlertTriangle size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
              Behavioral Warning — {psychState?.replace(/_/g, ' ')}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {behavioralData.warningMessage || 'Your behavioral state is elevated. Review your plan before your next action.'}
            </p>
          </div>
        </div>
      )}

      {/* ── 6 agent cards grid ── */}
      {perspectives.length > 0 && (
        <div className="copilot-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Copilot Consensus · {perspectives.length}/6 agents
              </div>
              <span style={{
                fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
                background: 'rgba(0,120,212,0.1)', color: '#0078D4',
                border: '1px solid rgba(0,120,212,0.25)',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                Azure GPT-4o
              </span>
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

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {session.stopLossNote && (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Stop Loss Note</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{session.stopLossNote}</div>
              </div>
            )}
            {session.nextDecisionLevel && (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Next Decision At</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
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
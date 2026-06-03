"use client"

import { useState, useEffect } from 'react'
import { Plus, Radio, CheckCircle } from 'lucide-react'
import NewPositionModal from '@/components/copilot/NewPositionModal'
import CopilotPanel    from '@/components/copilot/CopilotPanel'

interface Position {
  id: string; symbol: string; side: string; entryPrice: number
  quantity: number; stopLoss: number | null; targetPrice: number | null
  status: string; openedAt: string; pnlDollar: number | null; pnlPct: number | null
  session: { status: string; overallSignal: string | null; lastRefreshedAt: string | null } | null
}

function timeSince(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60)   return `${sec}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}m`
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function signalBadge(signal: string | null) {
  if (!signal) return null
  const colors: Record<string, { c: string; bg: string; border: string }> = {
    FAVORABLE_CONDITIONS: { c: 'var(--bull)',        bg: 'var(--bull-dim)',        border: 'rgba(34,197,94,0.2)' },
    HOLD_POSITION:        { c: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)', border: 'rgba(59,130,246,0.2)' },
    ADD_CAUTION:          { c: 'var(--warning)',      bg: 'var(--warning-dim)',     border: 'rgba(245,158,11,0.2)' },
    REVIEW_STOP:          { c: 'var(--warning)',      bg: 'var(--warning-dim)',     border: 'rgba(245,158,11,0.2)' },
    EXIT_NOW:             { c: 'var(--bear)',         bg: 'var(--bear-dim)',        border: 'rgba(239,68,68,0.2)' },
  }
  const s = colors[signal] ?? { c: 'var(--text-secondary)', bg: 'var(--bg-subtle)', border: 'var(--border-muted)' }
  return (
    <span style={{
      fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
      color: s.c, background: s.bg, border: `1px solid ${s.border}`,
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {signal.replace(/_/g, ' ')}
    </span>
  )
}

function PositionRow({ p, active, onClick }: { p: Position; active: boolean; onClick: () => void }) {
  const isOpen   = p.status === 'OPEN'
  const hasPnl   = p.pnlDollar !== null && p.pnlPct !== null
  const pnlColor = (p.pnlDollar ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)'

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '12px 14px',
        borderRadius: '10px', border: `1px solid ${active ? 'var(--border-active)' : 'var(--border-muted)'}`,
        background: active ? 'var(--accent-blue-dim)' : 'var(--bg-card)',
        cursor: 'pointer', transition: 'all 0.15s ease', display: 'block',
      }}
    >
      {/* Top row: symbol + side + signal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
            {p.symbol}
          </span>
          <span style={{
            fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
            background: p.side === 'LONG' ? 'var(--bull-dim)' : 'var(--bear-dim)',
            color: p.side === 'LONG' ? 'var(--bull)' : 'var(--bear)',
            border: `1px solid ${p.side === 'LONG' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            {p.side}
          </span>
          {!isOpen && <CheckCircle size={12} color="var(--text-muted)" />}
        </div>
        {p.session?.overallSignal
          ? signalBadge(p.session.overallSignal)
          : isOpen && !p.session
            ? <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No session</span>
            : null
        }
      </div>

      {/* Bottom row: entry price + time + pnl + live badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            ${p.entryPrice.toFixed(2)}
          </span>
          {isOpen && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {timeSince(p.openedAt)}
            </span>
          )}
          {hasPnl && !isOpen && (
            <span style={{ fontSize: '11px', fontWeight: '700', color: pnlColor, fontFamily: 'JetBrains Mono, monospace' }}>
              {(p.pnlDollar! >= 0 ? '+' : '')}${p.pnlDollar!.toFixed(0)} ({(p.pnlPct! >= 0 ? '+' : '')}{p.pnlPct!.toFixed(1)}%)
            </span>
          )}
        </div>
        {p.session?.status === 'ACTIVE' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div className="pulse-dot" style={{ width: '5px', height: '5px' }} />
            <span style={{ fontSize: '10px', color: 'var(--bull)', fontWeight: '600' }}>LIVE</span>
          </div>
        )}
      </div>
    </button>
  )
}

export default function CopilotPage() {
  const [positions,  setPositions]  = useState<Position[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showModal,  setShowModal]  = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<'OPEN' | 'CLOSED' | 'ALL'>('OPEN')
  const [tick,       setTick]       = useState(0)

  useEffect(() => {
    fetch('/api/positions')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setPositions(d.data)
          const first = d.data.find((p: Position) => p.status === 'OPEN')
          if (first) setSelectedId(first.id)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Tick every 30s to refresh "time since open" labels in the list
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  function handleCreated(position: any) {
    setPositions(prev => [{ ...position, session: null }, ...prev])
    setSelectedId(position.id)
    setShowModal(false)
  }

  function handlePositionUpdate(updated: any) {
    setPositions(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
  }

  const filtered   = positions.filter(p => filter === 'ALL' ? true : p.status === filter)
  const selected   = positions.find(p => p.id === selectedId) ?? null
  const openCount  = positions.filter(p => p.status === 'OPEN').length

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left panel: position list ── */}
      <div style={{
        width: '290px', flexShrink: 0,
        borderRight: '1px solid var(--border-muted)',
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-muted)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Radio size={15} color="var(--accent-blue)" />
                Live Copilot
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {openCount} open · {positions.length} total
              </div>
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)}
              style={{ padding: '7px 12px', fontSize: '12px', gap: '4px' }}>
              <Plus size={13} /> New
            </button>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-subtle)', borderRadius: '8px', padding: '3px' }}>
            {(['OPEN', 'CLOSED', 'ALL'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                flex: 1, padding: '5px', borderRadius: '6px', border: 'none',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                background: filter === f ? 'var(--bg-card)' : 'transparent',
                color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {loading && (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              Loading positions...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <Radio size={24} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {filter === 'OPEN'
                  ? <>No open positions.<br />Click <strong>New</strong> to enter a trade.</>
                  : `No ${filter.toLowerCase()} positions.`
                }
              </div>
            </div>
          )}

          {filtered.map(p => (
            <PositionRow
              key={`${p.id}-${tick}`}
              p={p}
              active={p.id === selectedId}
              onClick={() => setSelectedId(p.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel: copilot panel ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {!selected && !loading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: '14px',
          }}>
            <Radio size={40} color="var(--text-muted)" />
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              No position selected
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '340px', lineHeight: '1.6' }}>
              Open a new position or select an existing one to activate the 6-agent live trading copilot.
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={13} /> Open First Position
            </button>
          </div>
        )}

        {selected && (
          <CopilotPanel
            position={selected}
            onPositionUpdate={handlePositionUpdate}
          />
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <NewPositionModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
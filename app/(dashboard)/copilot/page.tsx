"use client"

import { useState, useEffect } from 'react'
import { Plus, TrendingUp, TrendingDown, Radio, CheckCircle } from 'lucide-react'
import NewPositionModal from '@/components/copilot/NewPositionModal'
import CopilotPanel    from '@/components/copilot/CopilotPanel'

interface Position {
  id: string; symbol: string; side: string; entryPrice: number
  quantity: number; stopLoss: number | null; targetPrice: number | null
  status: string; openedAt: string; pnlDollar: number | null; pnlPct: number | null
  session: { status: string; overallSignal: string | null; lastRefreshedAt: string | null } | null
}

function signalBadge(signal: string | null) {
  if (!signal) return null
  const colors: Record<string, { c: string; bg: string }> = {
    FAVORABLE_CONDITIONS: { c: 'var(--bull)',        bg: 'var(--bull-dim)' },
    HOLD_POSITION:        { c: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)' },
    ADD_CAUTION:          { c: 'var(--warning)',      bg: 'var(--warning-dim)' },
    REVIEW_STOP:          { c: 'var(--warning)',      bg: 'var(--warning-dim)' },
    EXIT_NOW:             { c: 'var(--bear)',         bg: 'var(--bear-dim)' },
  }
  const style = colors[signal] ?? { c: 'var(--text-secondary)', bg: 'var(--bg-subtle)' }
  return (
    <span style={{
      fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px',
      color: style.c, background: style.bg, fontFamily: 'JetBrains Mono, monospace',
    }}>
      {signal.replace(/_/g, ' ')}
    </span>
  )
}

function PositionRow({ p, active, onClick }: { p: Position; active: boolean; onClick: () => void }) {
  const isOpen = p.status === 'OPEN'
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{p.symbol}</span>
          <span style={{
            fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
            background: p.side === 'LONG' ? 'var(--bull-dim)' : 'var(--bear-dim)',
            color: p.side === 'LONG' ? 'var(--bull)' : 'var(--bear)',
          }}>
            {p.side}
          </span>
          {!isOpen && <CheckCircle size={12} color="var(--text-muted)" />}
        </div>
        {p.session?.overallSignal ? signalBadge(p.session.overallSignal) : (
          isOpen && p.session === null
            ? <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No session</span>
            : null
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          ${p.entryPrice.toFixed(2)}
        </span>
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
  const [positions,   setPositions]   = useState<Position[]>([])
  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [showModal,   setShowModal]   = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<'OPEN' | 'CLOSED' | 'ALL'>('OPEN')

  useEffect(() => {
    fetch('/api/positions')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setPositions(d.data)
          // Auto-select first open position
          const first = d.data.find((p: Position) => p.status === 'OPEN')
          if (first) setSelectedId(first.id)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function handleCreated(position: Position) {
    setPositions(prev => [position, ...prev])
    setSelectedId(position.id)
    setShowModal(false)
  }

  const filtered = positions.filter(p =>
    filter === 'ALL' ? true : p.status === filter
  )
  const selected = positions.find(p => p.id === selectedId) ?? null

  const openCount = positions.filter(p => p.status === 'OPEN').length

  return (
    <div style={{ display: 'flex', height: '100%', gap: '0', overflow: 'hidden' }}>

      {/* ── Left panel: position list ── */}
      <div style={{
        width: '280px', flexShrink: 0,
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
                {openCount} open position{openCount !== 1 ? 's' : ''}
              </div>
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)}
              style={{ padding: '7px 12px', fontSize: '12px', gap: '4px' }}>
              <Plus size={13} /> New
            </button>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['OPEN', 'CLOSED', 'ALL'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                flex: 1, padding: '5px', borderRadius: '6px', border: 'none',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                background: filter === f ? 'var(--accent-blue-dim)' : 'transparent',
                color: filter === f ? 'var(--accent-blue)' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
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
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {filter === 'OPEN' ? 'No open positions.\nClick New to enter a trade.' : `No ${filter.toLowerCase()} positions.`}
              </div>
            </div>
          )}

          {filtered.map(p => (
            <PositionRow
              key={p.id}
              p={p}
              active={p.id === selectedId}
              onClick={() => setSelectedId(p.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel: copilot panel ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {!selected && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: '14px',
          }}>
            <Radio size={40} color="var(--text-muted)" />
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              No position selected
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '340px' }}>
              Open a new position or select an existing one to activate the 6-agent live trading copilot.
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={13} /> Open First Position
            </button>
          </div>
        )}

        {selected && <CopilotPanel position={selected} />}
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
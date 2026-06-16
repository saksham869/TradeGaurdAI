"use client"

import { useState, useEffect } from 'react'

interface RegimeData {
  current_regime: string
  confidence: number
  posterior: Record<string, number>
  source: string
  resolvedIndex: string
}

const REGIME_STYLE: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  BULL_TREND:  { dot: '#22c55e', text: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)'  },
  BEAR_TREND:  { dot: '#ef4444', text: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)'  },
  CHOP:        { dot: '#f59e0b', text: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  CRISIS:      { dot: '#f97316', text: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' },
}

const DEFAULT_STYLE = { dot: '#6b7280', text: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' }

interface Props {
  symbol?: string  // user-facing symbol; resolved to home index server-side
}

export default function RegimeBadge({ symbol = 'RELIANCE.NS' }: Props) {
  const [regime, setRegime]     = useState<RegimeData | null>(null)
  const [tooltip, setTooltip]   = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch(`/api/regime?symbol=${encodeURIComponent(symbol)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setRegime(d.data) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [symbol])

  if (loading) return <span style={{ width:80, height:22, borderRadius:100, background:'var(--bg-subtle)', display:'inline-block' }} />

  const s = regime ? (REGIME_STYLE[regime.current_regime] ?? DEFAULT_STYLE) : DEFAULT_STYLE
  const label = regime ? `${regime.current_regime.replace('_', ' ')} · ${(regime.confidence * 100).toFixed(0)}%` : 'Regime —'

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        onClick={() => setTooltip(t => !t)}
        style={{ display:'flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:100, background:s.bg, border:`1px solid ${s.border}`, cursor:'pointer' }}
      >
        <span style={{ width:7, height:7, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
        <span style={{ fontSize:'11px', fontWeight:'600', color:s.text, whiteSpace:'nowrap' }}>{label}</span>
        {regime?.source === 'heuristic' && (
          <span style={{ fontSize:'10px', color:'var(--text-muted)', marginLeft:2 }}>(approx)</span>
        )}
      </button>

      {tooltip && regime && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:100, background:'var(--bg-surface)', border:'1px solid var(--border-muted)', borderRadius:'10px', padding:'12px 14px', minWidth:'200px', boxShadow:'0 8px 24px rgba(0,0,0,0.35)' }}>
          <div style={{ fontSize:'11px', fontWeight:'700', color:'var(--text-primary)', marginBottom:'6px' }}>
            {regime.resolvedIndex} Regime
          </div>
          {Object.entries(regime.posterior).sort((a,b) => b[1]-a[1]).map(([r, p]) => {
            const rs = REGIME_STYLE[r] ?? DEFAULT_STYLE
            const pct = (p * 100).toFixed(0)
            return (
              <div key={r} style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:rs.dot, flexShrink:0 }} />
                <span style={{ fontSize:'11px', color:'var(--text-secondary)', flex:1 }}>{r.replace('_',' ')}</span>
                <div style={{ width:60, height:4, borderRadius:2, background:'var(--bg-subtle)', overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', background:rs.dot, borderRadius:2 }} />
                </div>
                <span style={{ fontSize:'10px', color:'var(--text-muted)', width:28, textAlign:'right' }}>{pct}%</span>
              </div>
            )
          })}
          <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'8px', borderTop:'1px solid var(--border-muted)', paddingTop:'6px' }}>
            Source: {regime.source} · 6h cache
          </div>
        </div>
      )}
    </div>
  )
}

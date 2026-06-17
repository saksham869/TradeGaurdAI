"use client"

import { useState, useEffect } from 'react'
import { Brain, ChevronDown, ChevronUp } from 'lucide-react'
import DirectiveCard from '@/components/mind/DirectiveCard'
import TraderModelCard from '@/components/mind/TraderModelCard'
import RegimeBadge from '@/components/shared/RegimeBadge'

interface DirectiveHistory {
  id:             string
  directiveDate:  string
  acknowledged:   boolean
  directive: { headline: string; todayEV: string; sizeGuidance: string }
}

const EV_COLOR: Record<string, string> = {
  POSITIVE: 'var(--bull)',
  NEGATIVE: 'var(--bear)',
  NEUTRAL:  'var(--text-secondary)',
  UNKNOWN:  'var(--text-muted)',
}

const REGIME_STYLE: Record<string, { dot: string }> = {
  BULL_TREND: { dot: '#22c55e' },
  BEAR_TREND: { dot: '#ef4444' },
  CHOP:       { dot: '#f59e0b' },
  CRISIS:     { dot: '#f97316' },
}

interface RegimeData {
  current_regime: string
  confidence: number
  posterior:  Record<string, number>
  source:     string
  resolvedIndex: string
}

function RegimePanel({ symbol }: { symbol: string }) {
  const [regime,  setRegime]  = useState<RegimeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/regime?symbol=${encodeURIComponent(symbol)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setRegime(d.data) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [symbol])

  if (loading) {
    return (
      <div className="glass-card" style={{ padding:'16px' }}>
        <div style={{ height:'12px', width:'80px', background:'var(--bg-subtle)', borderRadius:'4px' }} />
      </div>
    )
  }

  if (!regime) return null

  const dot   = (REGIME_STYLE[regime.current_regime] ?? { dot: '#6b7280' }).dot
  const label = regime.current_regime.replace(/_/g, ' ')

  return (
    <div className="glass-card" style={{ padding:'16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:dot, display:'inline-block' }} />
          <span style={{ fontSize:'13px', fontWeight:'700', color:'var(--text-primary)' }}>{regime.resolvedIndex}</span>
        </div>
        <span style={{ fontSize:'11px', fontWeight:'700', padding:'2px 8px', borderRadius:'4px', background:dot+'20', color:dot }}>
          {label}
        </span>
      </div>

      <div style={{ marginBottom:'10px' }}>
        <div style={{ fontSize:'11px', color:'var(--text-muted)', marginBottom:'6px' }}>
          Confidence: {(regime.confidence * 100).toFixed(0)}%
          {regime.source === 'heuristic' && <span style={{ marginLeft:'4px' }}>(approx)</span>}
        </div>
        {Object.entries(regime.posterior).sort((a, b) => b[1] - a[1]).map(([r, p]) => {
          const rdot = (REGIME_STYLE[r] ?? { dot: '#6b7280' }).dot
          const pct  = (p * 100).toFixed(0)
          return (
            <div key={r} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:rdot, flexShrink:0 }} />
              <span style={{ fontSize:'11px', color:'var(--text-secondary)', flex:1 }}>{r.replace(/_/g,' ')}</span>
              <div style={{ width:80, height:4, borderRadius:2, background:'var(--bg-subtle)', overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:rdot, borderRadius:2 }} />
              </div>
              <span style={{ fontSize:'10px', color:'var(--text-muted)', width:32, textAlign:'right', fontFamily:'JetBrains Mono,monospace' }}>{pct}%</span>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize:'10px', color:'var(--text-muted)', borderTop:'1px solid var(--border-muted)', paddingTop:'8px' }}>
        Source: {regime.source} · 6h cache
      </div>
    </div>
  )
}

export default function MindPage() {
  const [history,  setHistory]  = useState<DirectiveHistory[]>([])
  const [isPro,    setIsPro]    = useState(false)
  const [showHist, setShowHist] = useState(false)

  useEffect(() => {
    fetch('/api/mind/directive')
      .then(r => r.json())
      .then(d => { if (d.plan) setIsPro(d.plan === 'PRO') })
      .catch(() => null)

    fetch('/api/mind/directive/history')
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setHistory(d.data) })
      .catch(() => null)
  }, [])

  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
          <Brain size={18} color="var(--accent-blue)" />
          <h1 style={{ fontSize:'20px', fontWeight:'700', color:'var(--text-primary)' }}>Mind Engine</h1>
          <div style={{ display:'flex', gap:'6px', marginLeft:'auto' }}>
            <RegimeBadge symbol="^NSEI" />
            <RegimeBadge symbol="^GSPC" />
          </div>
        </div>
        <p style={{ fontSize:'13px', color:'var(--text-muted)' }}>
          Daily directive · TraderModel · Market regime — all in one place
        </p>
      </div>

      {/* Three-column layout */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 280px', gap:'20px', alignItems:'start' }} className="mind-grid">

        {/* Column 1: Directive + history */}
        <div>
          <DirectiveCard isPro={isPro} />

          {/* Directive history */}
          {history.length > 1 && (
            <div className="glass-card" style={{ padding:'16px', marginTop:'16px' }}>
              <button
                onClick={() => setShowHist(h => !h)}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', background:'none', border:'none', cursor:'pointer', padding:0 }}
              >
                <span style={{ fontSize:'12px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  Past Directives ({history.length - 1})
                </span>
                {showHist ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
              </button>

              {showHist && (
                <div style={{ marginTop:'10px', display:'flex', flexDirection:'column', gap:'8px' }}>
                  {history.slice(1).map(d => (
                    <div key={d.id} style={{ padding:'10px 12px', borderRadius:'8px', background:'var(--bg-subtle)', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontSize:'11px', fontFamily:'JetBrains Mono,monospace', color:'var(--text-muted)', flexShrink:0 }}>{d.directiveDate}</span>
                      <span style={{ fontSize:'12px', color:'var(--text-secondary)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {d.directive.headline}
                      </span>
                      <span style={{ fontSize:'10px', fontWeight:'700', color: EV_COLOR[d.directive.todayEV] ?? 'var(--text-muted)', flexShrink:0 }}>
                        {d.directive.todayEV}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Column 2: Full TraderModelCard */}
        <div>
          <TraderModelCard />
        </div>

        {/* Column 3: Regime panels */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Market Regimes
          </div>
          <RegimePanel symbol="^NSEI" />
          <RegimePanel symbol="^GSPC" />
          <p style={{ fontSize:'10px', color:'var(--text-muted)', lineHeight:'1.5' }}>
            Regime is computed by a Gaussian HMM classifier on 5 years of daily returns.
            Heuristic fallback when the Python service is unavailable.
            6-hour Redis cache. Not investment advice.
          </p>
        </div>
      </div>
    </div>
  )
}

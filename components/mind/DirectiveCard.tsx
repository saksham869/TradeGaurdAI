"use client"

import { useState, useEffect, useCallback } from 'react'
import { Brain, ChevronRight, CheckCircle, TrendingUp, TrendingDown, AlertTriangle, Lock } from 'lucide-react'

interface SetupEntry { setup: string; winRate: number; sampleSize: number }

interface DirectiveData {
  id:                string
  directiveDate:     string
  acknowledged:      boolean
  directive: {
    headline:          string
    marketRead:        string
    personalRead:      string
    todayEV:           'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'UNKNOWN'
    todayEVReason:     string
    greenlightSetups:  SetupEntry[]
    avoidSetups:       SetupEntry[]
    behavioralWatch:   string | null
    sizeGuidance:      'NORMAL' | 'REDUCED' | 'MINIMUM' | 'SIT_OUT_SUGGESTED'
    sizeGuidanceReason:string
    oneRule:           string
  }
}

const EV_CONFIG = {
  POSITIVE: { label:'POSITIVE EV',      bg:'var(--bull-dim)',    color:'var(--bull)',    Icon: TrendingUp   },
  NEGATIVE: { label:'NEGATIVE EV',      bg:'var(--bear-dim)',    color:'var(--bear)',    Icon: TrendingDown },
  NEUTRAL:  { label:'NEUTRAL',          bg:'var(--bg-subtle)',   color:'var(--text-secondary)', Icon: Brain   },
  UNKNOWN:  { label:'UNKNOWN',          bg:'var(--bg-subtle)',   color:'var(--text-muted)',     Icon: Brain   },
}

const SIZE_CONFIG = {
  NORMAL:              { label:'NORMAL SIZE',       color:'var(--bull)' },
  REDUCED:             { label:'REDUCED SIZE',      color:'var(--warning)' },
  MINIMUM:             { label:'MINIMUM SIZE',      color:'var(--bear)' },
  SIT_OUT_SUGGESTED:   { label:'SIT OUT SUGGESTED', color:'var(--bear)' },
}

interface Props {
  isPro: boolean
}

export default function DirectiveCard({ isPro }: Props) {
  const [data,       setData]       = useState<DirectiveData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)
  const [acked,      setAcked]      = useState(false)
  const [collapsed,  setCollapsed]  = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/mind/directive')
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
        setAcked(json.data.acknowledged)
        if (json.data.acknowledged) setCollapsed(true)
      } else if (json.generating) {
        setGenerating(true)
        // Poll once after 4 seconds
        setTimeout(async () => {
          const res2  = await fetch('/api/mind/directive')
          const json2 = await res2.json()
          if (json2.success && json2.data) {
            setData(json2.data)
            setAcked(json2.data.acknowledged)
          }
          setGenerating(false)
        }, 4000)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function acknowledge() {
    try {
      await fetch('/api/mind/directive/ack', { method: 'POST' })
      setAcked(true)
      setCollapsed(true)
    } catch {
      // silent
    }
  }

  if (loading) return null

  if (generating) {
    return (
      <div className="glass-card" style={{ padding:'14px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
        <Brain size={14} color="var(--accent-blue)" style={{ flexShrink:0 }} />
        <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>Mind Engine is generating your daily directive…</span>
      </div>
    )
  }

  if (!data) return null

  const d = data.directive
  const evCfg   = EV_CONFIG[d.todayEV]   ?? EV_CONFIG.UNKNOWN
  const sizeCfg = SIZE_CONFIG[d.sizeGuidance] ?? SIZE_CONFIG.NORMAL

  // Collapsed state — one-line bar after ack
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          width:'100%', textAlign:'left', marginBottom:'16px',
          padding:'10px 14px', borderRadius:'10px',
          background:'var(--glass-bg)', border:'1px solid var(--border-muted)',
          display:'flex', alignItems:'center', gap:'10px', cursor:'pointer',
        }}
      >
        <CheckCircle size={13} color="var(--bull)" style={{ flexShrink:0 }} />
        <span style={{ fontSize:'12px', color:'var(--text-secondary)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {d.headline}
        </span>
        <span style={{ fontSize:'10px', color:'var(--text-muted)', flexShrink:0 }}>Mind Directive · acked</span>
        <ChevronRight size={12} color="var(--text-muted)" style={{ flexShrink:0 }} />
      </button>
    )
  }

  // FREE plan — blurred preview + upgrade CTA
  if (!isPro) {
    return (
      <div className="glass-card" style={{ padding:'20px', marginBottom:'16px', position:'relative', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
          <Brain size={15} color="var(--accent-blue)" />
          <span style={{ fontSize:'13px', fontWeight:'700', color:'var(--text-primary)' }}>Mind Directive</span>
          <span style={{ fontSize:'10px', padding:'2px 7px', borderRadius:'100px', background:'var(--warning-dim)', color:'var(--warning)', fontWeight:'700' }}>PRO</span>
        </div>
        {/* Blurred preview */}
        <div style={{ filter:'blur(5px)', userSelect:'none', pointerEvents:'none', marginBottom:'12px' }}>
          <div style={{ height:'16px', background:'var(--bg-subtle)', borderRadius:'4px', marginBottom:'8px' }} />
          <div style={{ height:'16px', background:'var(--bg-subtle)', borderRadius:'4px', width:'80%', marginBottom:'8px' }} />
          <div style={{ height:'12px', background:'var(--bg-subtle)', borderRadius:'4px', width:'60%' }} />
        </div>
        <div style={{ textAlign:'center', padding:'8px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', justifyContent:'center', marginBottom:'8px' }}>
            <Lock size={13} color="var(--text-muted)" />
            <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>
              Daily AI directive fused with your TraderModel
            </span>
          </div>
          <a
            href="/billing"
            style={{
              display:'inline-flex', alignItems:'center', gap:'6px',
              padding:'8px 18px', borderRadius:'8px',
              background:'var(--accent-blue)', color:'#fff',
              fontSize:'12px', fontWeight:'700', textDecoration:'none',
            }}
          >
            Upgrade to PRO — ₹499/mo
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card" style={{ padding:'20px', marginBottom:'16px', borderLeft:'3px solid var(--accent-blue)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <Brain size={15} color="var(--accent-blue)" />
          <span style={{ fontSize:'13px', fontWeight:'700', color:'var(--text-primary)' }}>Mind Directive</span>
          <span style={{ fontSize:'10px', color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace' }}>{data.directiveDate}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'11px', fontWeight:'700', padding:'2px 8px', borderRadius:'4px', background:evCfg.bg, color:evCfg.color }}>
            {evCfg.label}
          </span>
          <span style={{ fontSize:'11px', fontWeight:'700', padding:'2px 8px', borderRadius:'4px', color:sizeCfg.color, background:sizeCfg.color + '15' }}>
            {sizeCfg.label}
          </span>
        </div>
      </div>

      {/* Headline */}
      <p style={{ fontSize:'14px', fontWeight:'700', color:'var(--text-primary)', marginBottom:'14px', lineHeight:'1.4' }}>
        {d.headline}
      </p>

      {/* Reads */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }} className="directive-reads">
        <div style={{ padding:'10px 12px', borderRadius:'8px', background:'var(--bg-subtle)' }}>
          <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'5px' }}>Market Read</div>
          <p style={{ fontSize:'12px', color:'var(--text-secondary)', lineHeight:'1.5' }}>{d.marketRead}</p>
        </div>
        <div style={{ padding:'10px 12px', borderRadius:'8px', background:'var(--bg-subtle)' }}>
          <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'5px' }}>Personal Read</div>
          <p style={{ fontSize:'12px', color:'var(--text-secondary)', lineHeight:'1.5' }}>{d.personalRead}</p>
        </div>
      </div>

      {/* EV reason */}
      <p style={{ fontSize:'12px', color:'var(--text-secondary)', marginBottom:'14px', lineHeight:'1.5' }}>
        <span style={{ fontWeight:'700', color:evCfg.color }}>{evCfg.label}: </span>
        {d.todayEVReason}
      </p>

      {/* Greenlight / Avoid chips */}
      {(d.greenlightSetups.length > 0 || d.avoidSetups.length > 0) && (
        <div style={{ display:'flex', gap:'16px', marginBottom:'14px', flexWrap:'wrap' }}>
          {d.greenlightSetups.length > 0 && (
            <div>
              <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--bull)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'5px' }}>Greenlight</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {d.greenlightSetups.map(s => (
                  <span key={s.setup} style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'4px', background:'var(--bull-dim)', color:'var(--bull)', fontWeight:'600' }}>
                    {s.setup}
                    {s.sampleSize > 0 && <span style={{ fontSize:'10px', opacity:0.7 }}> {(s.winRate*100).toFixed(0)}% n={s.sampleSize}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          {d.avoidSetups.length > 0 && (
            <div>
              <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--bear)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'5px' }}>Avoid</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {d.avoidSetups.map(s => (
                  <span key={s.setup} style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'4px', background:'var(--bear-dim)', color:'var(--bear)', fontWeight:'600' }}>
                    {s.setup}
                    {s.sampleSize > 0 && <span style={{ fontSize:'10px', opacity:0.7 }}> {(s.winRate*100).toFixed(0)}% n={s.sampleSize}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Size guidance */}
      <div style={{ padding:'8px 12px', borderRadius:'8px', background:sizeCfg.color + '10', border:`1px solid ${sizeCfg.color}30`, marginBottom:'14px' }}>
        <span style={{ fontSize:'11px', fontWeight:'700', color:sizeCfg.color }}>{sizeCfg.label}: </span>
        <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{d.sizeGuidanceReason}</span>
      </div>

      {/* Behavioral watch */}
      {d.behavioralWatch && (
        <div style={{ display:'flex', gap:'8px', padding:'8px 12px', borderRadius:'8px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', marginBottom:'14px' }}>
          <AlertTriangle size={13} color="var(--warning)" style={{ flexShrink:0, marginTop:'1px' }} />
          <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{d.behavioralWatch}</span>
        </div>
      )}

      {/* ONE RULE */}
      <div style={{ padding:'12px 14px', borderRadius:'8px', background:'rgba(245,158,11,0.06)', border:'2px solid rgba(245,158,11,0.25)', marginBottom:'16px' }}>
        <div style={{ fontSize:'10px', fontWeight:'800', color:'var(--warning)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'5px' }}>Today&apos;s Rule</div>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--text-primary)', fontStyle:'italic', lineHeight:'1.4' }}>&ldquo;{d.oneRule}&rdquo;</p>
      </div>

      {/* Got-it ack */}
      {!acked ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' }}>
          <p style={{ fontSize:'10px', color:'var(--text-muted)', lineHeight:'1.5', maxWidth:'360px' }}>
            This is not investment advice. TradeGuard AI does not place trades. All analysis is for educational purposes only.
          </p>
          <button
            onClick={acknowledge}
            style={{
              display:'inline-flex', alignItems:'center', gap:'6px',
              padding:'8px 16px', borderRadius:'8px',
              background:'var(--accent-blue)', color:'#fff',
              fontSize:'12px', fontWeight:'700', cursor:'pointer', border:'none',
            }}
          >
            <CheckCircle size={13} /> Got it — collapse
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <CheckCircle size={13} color="var(--bull)" />
          <span style={{ fontSize:'11px', color:'var(--bull)' }}>Acknowledged</span>
          <p style={{ fontSize:'10px', color:'var(--text-muted)', marginLeft:'8px' }}>
            This is not investment advice. TradeGuard AI does not place trades.
          </p>
        </div>
      )}
    </div>
  )
}

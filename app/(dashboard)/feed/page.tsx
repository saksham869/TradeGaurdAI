"use client"

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, AlertTriangle, BarChart2, Flame, Brain, RefreshCw } from 'lucide-react'
import IntelligenceFeed from '@/components/feed/IntelligenceFeed'
import RegimeBadge from '@/components/shared/RegimeBadge'
import DirectiveCard from '@/components/mind/DirectiveCard'

interface FeedStats {
  total:        number
  bullish:      number
  traps:        number
  avgSentiment: number
}

interface TrendingItem {
  id:            string
  symbol:        string
  hypeRating:    string
  sentimentScore: number
  mentionCount:  number
  grokAnalysis?: string | null
  priceChange1h?: number | null
}

interface MarketBrief {
  paragraph1?:     string
  paragraph2?:     string
  paragraph3?:     string
  topRisk?:        string
  marketMood?:     string
  suggestedFocus?: string[]
}

const HYPE_COLOR: Record<string, string> = {
  EXTREME: 'var(--bear)',
  HIGH:    'var(--warning)',
  MODERATE:'var(--accent-blue)',
  LOW:     'var(--bull)',
  ORGANIC: 'var(--bull)',
}

const MOOD_COLOR: Record<string, string> = {
  RISK_ON:  'var(--bull)',
  RISK_OFF: 'var(--bear)',
  VOLATILE: 'var(--bear)',
  CAUTIOUS: 'var(--warning)',
  RANGING:  'var(--accent-blue)',
}

export default function FeedPage() {
  const [stats,     setStats]     = useState<FeedStats | null>(null)
  const [trending,  setTrending]  = useState<TrendingItem[]>([])
  const [brief,     setBrief]     = useState<MarketBrief | null>(null)
  const [briefDate, setBriefDate] = useState<string | null>(null)
  const [generatingBrief, setGeneratingBrief] = useState(false)
  const [isPro,     setIsPro]     = useState(false)

  useEffect(() => {
    // Load trending
    fetch('/api/trending')
      .then(r => r.json())
      .then(d => { if (d.success) setTrending(d.data.slice(0, 5)) })

    // Load morning brief
    fetch('/api/market-brief')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setBrief(d.data.aiSummary)
          setBriefDate(d.data.briefDate)
        }
      })

    // Check plan for DirectiveCard gating
    fetch('/api/mind/directive')
      .then(r => r.json())
      .then(d => { if (d.plan) setIsPro(d.plan === 'PRO') })
      .catch(() => null)
  }, [])

  async function generateBrief() {
    setGeneratingBrief(true)
    try {
      const res  = await fetch('/api/brief/generate', { method: 'POST' })
      const data = await res.json()
      if (data.success && data.data) {
        setBrief(data.data.aiSummary)
        setBriefDate(data.data.briefDate)
      }
    } finally {
      setGeneratingBrief(false)
    }
  }

  const cards = stats
    ? [
        { label: 'Events Today',    value: stats.total.toString(),       subtext: 'In feed',            color: 'var(--accent-blue)', Icon: Activity       },
        { label: 'Bullish Signals', value: stats.bullish.toString(),     subtext: `${stats.total ? Math.round(stats.bullish/stats.total*100) : 0}% of feed`, color: 'var(--bull)', Icon: TrendingUp },
        { label: 'Retail Traps',    value: stats.traps.toString(),       subtext: 'Active warnings',    color: 'var(--bear)',        Icon: AlertTriangle  },
        { label: 'Avg Sentiment',   value: `${stats.avgSentiment}/100`,  subtext: stats.avgSentiment >= 60 ? 'Slightly bullish' : stats.avgSentiment <= 45 ? 'Slightly bearish' : 'Neutral', color: 'var(--warning)', Icon: BarChart2 },
      ]
    : [
        { label: 'Events Today',    value: '—', subtext: 'Loading...', color: 'var(--accent-blue)', Icon: Activity      },
        { label: 'Bullish Signals', value: '—', subtext: 'Loading...', color: 'var(--bull)',        Icon: TrendingUp    },
        { label: 'Retail Traps',    value: '—', subtext: 'Loading...', color: 'var(--bear)',        Icon: AlertTriangle },
        { label: 'Avg Sentiment',   value: '—', subtext: 'Loading...', color: 'var(--warning)',     Icon: BarChart2     },
      ]

  return (
    <div>
      {/* Mind Directive — mounts at top until acked, then collapses */}
      <DirectiveCard isPro={isPro} />

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px', marginBottom:'4px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Intelligence Feed
          </h1>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <RegimeBadge symbol="^NSEI" />
            <RegimeBadge symbol="^GSPC" />
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          AI-analyzed market events · Real-time signals · Retail trap detection
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }} className="filter-row">
        {cards.map(({ label, value, subtext, color, Icon }) => (
          <div key={label} className="metric-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={13} color={color} />
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>{value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{subtext}</div>
          </div>
        ))}
      </div>

      <div className="research-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>

        {/* ── Left: main feed ── */}
        <div>
          <IntelligenceFeed onStatsLoad={setStats} />
        </div>

        {/* ── Right: sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Morning Brief */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Brain size={13} color="var(--accent-blue)" />
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Morning Brief
                </span>
              </div>
              {briefDate && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{briefDate}</span>
              )}
            </div>

            {brief ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {brief.marketMood && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Market mood</span>
                    <span style={{
                      fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px',
                      color: MOOD_COLOR[brief.marketMood] ?? 'var(--accent-blue)',
                      background: (MOOD_COLOR[brief.marketMood] ?? 'var(--accent-blue)') + '15',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {brief.marketMood.replace('_', ' ')}
                    </span>
                  </div>
                )}
                {brief.paragraph1 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{brief.paragraph1}</p>
                )}
                {brief.topRisk && (
                  <div style={{ background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--bear)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={9} /> Top Risk
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{brief.topRisk}</p>
                  </div>
                )}
                {brief.suggestedFocus && brief.suggestedFocus.length > 0 && (
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Watch Today</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {brief.suggestedFocus.map(f => (
                        <span key={f} style={{ fontSize: '10px', padding: '2px 7px', background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '4px', fontWeight: '600' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.5' }}>
                  No brief for today yet.<br />
                  Requires POLYGON_API_KEY for auto-generation.
                </p>
                <button
                  onClick={generateBrief}
                  disabled={generatingBrief}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px', borderRadius: '7px',
                    background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    fontSize: '11px', fontWeight: '600', cursor: generatingBrief ? 'not-allowed' : 'pointer',
                    opacity: generatingBrief ? 0.6 : 1,
                  }}
                >
                  {generatingBrief
                    ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                    : <><Brain size={11} /> Generate Brief</>
                  }
                </button>
              </div>
            )}
          </div>

          {/* Trending */}
          {trending.length > 0 && (
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Flame size={13} color="var(--warning)" />
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Trending Now
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {trending.map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', width: '14px', flexShrink: 0, marginTop: '1px' }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {item.symbol}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px',
                          color: HYPE_COLOR[item.hypeRating] ?? 'var(--text-muted)',
                          background: (HYPE_COLOR[item.hypeRating] ?? 'var(--text-muted)') + '15',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}>
                          {item.hypeRating}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto' }}>
                          {item.mentionCount}×
                        </span>
                      </div>
                      {item.grokAnalysis && (
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          {item.grokAnalysis}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
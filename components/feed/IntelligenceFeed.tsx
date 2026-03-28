"use client"

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, AlertTriangle, ExternalLink, Filter, RefreshCw } from 'lucide-react'

const MOCK_EVENTS = [
  {
    id: '1',
    symbol: 'NVDA',
    eventType: 'EARNINGS',
    impactLevel: 'HIGH',
    headline: 'NVIDIA Reports Record Q4 Revenue of $22.1B, Beats Estimates by 8%',
    publishedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    sentimentScore: 82,
    sentimentLabel: 'BULLISH',
    aiAnalysis: {
      whatHappened: 'NVIDIA posted record quarterly revenue of $22.1B driven by data center GPU demand — surpassing analyst estimates of $20.4B by 8.3%. EPS came in at $5.16 vs $4.64 expected.',
      whatItMeans: 'The beat signals AI infrastructure spending is accelerating faster than consensus expected. Data center segment grew 409% YoY, showing this is not a cyclical uptick but a structural shift.',
      retailMistake: 'Retail traders buying the gap open will likely get trapped — smart money bought weeks ago and may use this gap to distribute. Wait for a pullback to the 10-day EMA before entering.',
    },
    tags: ['AI', 'EARNINGS', 'DATA CENTER'],
  },
  {
    id: '2',
    symbol: 'AAPL',
    eventType: 'NEWS',
    impactLevel: 'MEDIUM',
    headline: 'Apple Vision Pro Sees Slower Adoption, Goldman Revises Estimates Down',
    publishedAt: new Date(Date.now() - 28 * 60000).toISOString(),
    sentimentScore: 38,
    sentimentLabel: 'BEARISH',
    aiAnalysis: {
      whatHappened: 'Goldman Sachs revised Vision Pro unit estimates from 1.2M to 600K for 2024, citing higher-than-expected return rates (30%+) from early adopters.',
      whatItMeans: 'Near-term sentiment headwind for AAPL in the $3,500 price bracket product. However, this is not a fundamental change to core iPhone/services revenue, which remain strong.',
      retailMistake: 'Do not extrapolate Vision Pro weakness to overall Apple fundamentals — this is a $3,500 niche product representing <0.1% of AAPL revenue. Selling AAPL here would be a mistake.',
    },
    tags: ['PRODUCT', 'ANALYST'],
  },
  {
    id: '3',
    symbol: 'MARKET',
    eventType: 'MACRO',
    impactLevel: 'HIGH',
    headline: 'Fed Minutes Show Two Governors Pushed for March Rate Cut Before Inflation Data',
    publishedAt: new Date(Date.now() - 55 * 60000).toISOString(),
    sentimentScore: 62,
    sentimentLabel: 'NEUTRAL',
    aiAnalysis: {
      whatHappened: 'Fed minutes released today revealed 2 of 12 governors argued for a 25bps March cut, while the majority favored holding rates at 5.25-5.5% pending more inflation evidence.',
      whatItMeans: 'Slight dovish lean in the reading. CME FedWatch is now pricing 68% probability for a June cut. Growth stocks and rate-sensitive sectors benefit from the dovish tilt.',
      retailMistake: null,
    },
    tags: ['FED', 'RATES', 'MACRO'],
  },
  {
    id: '4',
    symbol: 'TSLA',
    eventType: 'PRICE ACTION',
    impactLevel: 'MEDIUM',
    headline: 'Tesla Down 6.8% — Volume 3x Average as Institutions Distribute Into Strength',
    publishedAt: new Date(Date.now() - 85 * 60000).toISOString(),
    sentimentScore: 25,
    sentimentLabel: 'BEARISH',
    aiAnalysis: {
      whatHappened: 'TSLA fell 6.8% on 3x average volume following Musk\'s announcement of another equity offering. Dark pool data shows net institutional selling of ~$2.1B.',
      whatItMeans: 'Distribution day on heavy volume is a institutional exit signal. The equity dilution adds $42/share overhead pressure. Technical support at $175 is now the line in the sand.',
      retailMistake: 'Buying the dip here without confirmation is catching a falling knife. Retail inflows are surging into the red candle — classic retail trap. Wait for volume to dry up first.',
    },
    tags: ['DISTRIBUTION', 'DILUTION', 'TECHNICAL'],
  },
  {
    id: '5',
    symbol: 'META',
    eventType: 'UPGRADE',
    impactLevel: 'LOW',
    headline: 'Meta Upgraded to Overweight at Morgan Stanley, $590 Price Target',
    publishedAt: new Date(Date.now() - 140 * 60000).toISOString(),
    sentimentScore: 71,
    sentimentLabel: 'BULLISH',
    aiAnalysis: {
      whatHappened: 'Morgan Stanley upgraded META from Equal Weight to Overweight with a $590 price target, up from $490. Analyst cites AI-driven ads monetization and Llama 3 commercialization potential.',
      whatItMeans: 'Analyst upgrades from Tier 1 banks move institutional allocation. This upgrade likely triggers rotation by index funds and quant strategies tracking analyst sentiment.',
      retailMistake: null,
    },
    tags: ['UPGRADE', 'AI', 'ADVERTISING'],
  },
]

function getRelativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ago`
}

function SentimentIndicator({ score }: { score: number }) {
  if (score >= 65) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--bull)' }}>
      <TrendingUp size={12} />
      <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>{score}/100</span>
    </div>
  )
  if (score <= 40) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--bear)' }}>
      <TrendingDown size={12} />
      <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>{score}/100</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
      <Minus size={12} />
      <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>{score}/100</span>
    </div>
  )
}

function FeedCard({ event }: { event: typeof MOCK_EVENTS[0] }) {
  const [expanded, setExpanded] = useState(false)
  const analysis = event.aiAnalysis

  const sentimentClass = event.sentimentScore >= 65 ? 'badge-bull' : event.sentimentScore <= 40 ? 'badge-bear' : 'badge-neutral'
  const impactColor = event.impactLevel === 'HIGH' ? 'var(--bear)' : event.impactLevel === 'MEDIUM' ? 'var(--warning)' : 'var(--text-muted)'

  return (
    <div className="glass-card slide-in" style={{ padding: '16px', marginBottom: '12px', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="tag">{event.symbol}</span>
          <span className={`badge badge-neutral`} style={{ background: 'var(--bg-subtle)' }}>{event.eventType}</span>
          {event.impactLevel === 'HIGH' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', background: 'var(--bear-dim)', color: 'var(--bear)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '5px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em' }}>
              <AlertTriangle size={9} /> HIGH IMPACT
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{getRelativeTime(event.publishedAt)}</span>
          <SentimentIndicator score={event.sentimentScore} />
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Headline */}
      <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.5', marginBottom: '10px' }}>
        {event.headline}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: expanded ? '14px' : '0' }}>
        {event.tags.map(tag => (
          <span key={tag} style={{ fontSize: '10px', padding: '1px 6px', background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontWeight: '500' }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Expanded Analysis */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-muted)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'default' }} onClick={e => e.stopPropagation()}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px' }}>What Happened</div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{analysis.whatHappened}</p>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px' }}>What It Means</div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{analysis.whatItMeans}</p>
          </div>
          {analysis.retailMistake && (
            <div style={{ background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--bear)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={10} /> Retail Trap Warning
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{analysis.retailMistake}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function IntelligenceFeed() {
  const [filter, setFilter] = useState('ALL')
  const filters = ['ALL', 'EARNINGS', 'MACRO', 'NEWS', 'PRICE ACTION', 'UPGRADE']

  const filtered = filter === 'ALL' ? MOCK_EVENTS : MOCK_EVENTS.filter(e => e.eventType === filter)

  return (
    <div>
      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px', color: 'var(--text-muted)' }}>
          <Filter size={12} />
          <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em' }}>FILTER</span>
        </div>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: `1px solid ${filter === f ? 'rgba(59,130,246,0.4)' : 'var(--border-muted)'}`,
              background: filter === f ? 'rgba(59,130,246,0.1)' : 'var(--bg-surface)',
              color: filter === f ? 'var(--accent-blue)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              transition: 'all 0.15s ease',
            }}
          >
            {f}
          </button>
        ))}
        <button
          onClick={() => setFilter('ALL')}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'transparent', border: '1px solid var(--border-muted)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
        >
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* Feed List */}
      <div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No events match this filter.</div>
        ) : (
          filtered.map(event => <FeedCard key={event.id} event={event} />)
        )}
      </div>
    </div>
  )
}

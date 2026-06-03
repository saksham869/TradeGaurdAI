"use client"

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, AlertTriangle, Filter, RefreshCw } from 'lucide-react'

interface FeedEvent {
  id:             string
  symbol?:        string | null
  eventType:      string
  impactLevel:    string
  headline:       string
  publishedAt:    string
  sentimentScore: number
  sentimentLabel: string
  retailTrap:     boolean
  retailTrapText?: string | null
  aiAnalysis:     Record<string, any>
}

function getRelativeTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1)   return 'just now'
  if (diff < 60)  return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
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

function FeedCard({ event }: { event: FeedEvent }) {
  const [expanded, setExpanded] = useState(false)
  const ai = event.aiAnalysis || {}

  return (
    <div
      className="glass-card slide-in"
      style={{ padding: '16px', marginBottom: '10px', cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
          {event.symbol && <span className="tag">{event.symbol}</span>}
          <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {event.eventType}
          </span>
          {event.impactLevel === 'HIGH' || event.impactLevel === 'CRITICAL' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', background: 'var(--bear-dim)', color: 'var(--bear)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '5px', fontSize: '10px', fontWeight: '700' }}>
              <AlertTriangle size={9} /> {event.impactLevel}
            </span>
          ) : null}
          {event.retailTrap && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '5px', fontSize: '10px', fontWeight: '700' }}>
              ⚠ RETAIL TRAP
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {getRelativeTime(event.publishedAt)}
          </span>
          <SentimentIndicator score={event.sentimentScore} />
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Headline */}
      <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.5', marginBottom: expanded ? '14px' : '0' }}>
        {event.headline}
      </p>

      {/* Expanded AI analysis */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-muted)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={e => e.stopPropagation()}>
          {(ai.whatHappened) && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px' }}>What Happened</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{ai.whatHappened}</p>
            </div>
          )}
          {(ai.whatItMeans || ai.newsImpact) && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px' }}>What It Means</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{ai.whatItMeans || ai.newsImpact}</p>
            </div>
          )}
          {(ai.retailMistake || event.retailTrapText) && (
            <div style={{ background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--bear)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={10} /> Retail Trap Warning
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{ai.retailMistake || event.retailTrapText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  onStatsLoad?: (stats: { total: number; bullish: number; traps: number; avgSentiment: number }) => void
}

export default function IntelligenceFeed({ onStatsLoad }: Props) {
  const [events,   setEvents]   = useState<FeedEvent[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('ALL')
  const [refreshing, setRefreshing] = useState(false)

  const loadEvents = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const res  = await fetch('/api/feed')
      const data = await res.json()
      if (data.success) {
        const items: FeedEvent[] = data.data ?? data.events ?? []
        setEvents(items)
        if (onStatsLoad) {
          onStatsLoad({
            total:        items.length,
            bullish:      items.filter(e => e.sentimentScore >= 65).length,
            traps:        items.filter(e => e.retailTrap).length,
            avgSentiment: items.length
              ? Math.round(items.reduce((s, e) => s + e.sentimentScore, 0) / items.length)
              : 50,
          })
        }
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [onStatsLoad])

  useEffect(() => { loadEvents() }, [loadEvents])

  const eventTypes = ['ALL', ...Array.from(new Set(events.map(e => e.eventType))).sort()]
  const filtered   = filter === 'ALL' ? events : events.filter(e => e.eventType === filter)

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />)}
      </div>
    )
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px', color: 'var(--text-muted)' }}>
          <Filter size={12} />
          <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em' }}>FILTER</span>
        </div>
        {eventTypes.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
            border: `1px solid ${filter === f ? 'rgba(59,130,246,0.4)' : 'var(--border-muted)'}`,
            background: filter === f ? 'rgba(59,130,246,0.1)' : 'var(--bg-surface)',
            color: filter === f ? 'var(--accent-blue)' : 'var(--text-muted)',
            fontSize: '11px', fontWeight: '600', transition: 'all 0.15s ease',
          }}>
            {f}
          </button>
        ))}
        <button
          onClick={() => loadEvents(true)}
          disabled={refreshing}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'transparent', border: '1px solid var(--border-muted)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
        >
          <RefreshCw size={11} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Events */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed var(--border-muted)', borderRadius: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No events in feed.</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Add a POLYGON_API_KEY to your .env.local and run the news ingestion cron to populate the feed.
          </p>
        </div>
      ) : (
        filtered.map(event => <FeedCard key={event.id} event={event} />)
      )}
    </div>
  )
}
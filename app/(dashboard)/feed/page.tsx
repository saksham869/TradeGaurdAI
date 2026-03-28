import IntelligenceFeed from '@/components/feed/IntelligenceFeed'
import { Activity, TrendingUp, AlertTriangle, BarChart2 } from 'lucide-react'

const SUMMARY_CARDS = [
  { label: 'Events Today', value: '14', subtext: '+3 from yesterday', color: 'var(--accent-blue)', icon: Activity },
  { label: 'Bullish Signals', value: '8', subtext: '57% of feed', color: 'var(--bull)', icon: TrendingUp },
  { label: 'Retail Traps', value: '3', subtext: 'Active warnings', color: 'var(--bear)', icon: AlertTriangle },
  { label: 'Avg Sentiment', value: '61/100', subtext: 'Slightly bullish', color: 'var(--warning)', icon: BarChart2 },
]

export default function FeedPage() {
  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Intelligence Feed
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          AI-analyzed market events · Real-time signals · Retail trap detection
        </p>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="metric-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{card.label}</span>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} color={card.color} />
                </div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>{card.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{card.subtext}</div>
            </div>
          )
        })}
      </div>

      {/* Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0', maxWidth: '820px' }}>
        <IntelligenceFeed />
      </div>
    </div>
  )
}

"use client"

import { useState } from 'react'
import { Star, TrendingUp, TrendingDown, Plus, Trash2, Bell, BellOff } from 'lucide-react'

const INITIAL_WATCHLIST = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 875.40, change: +52.80, changePct: +6.42, volume: '89.2M', alert: true, sector: 'Technology' },
  { symbol: 'AAPL', name: 'Apple Inc', price: 185.92, change: +1.23, changePct: +0.67, volume: '52.4M', alert: false, sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 176.40, change: -12.30, changePct: -6.52, volume: '143.2M', alert: true, sector: 'Automotive' },
  { symbol: 'META', name: 'Meta Platforms', price: 523.10, change: +8.75, changePct: +1.70, volume: '21.3M', alert: false, sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp', price: 415.80, change: +2.10, changePct: +0.51, volume: '19.8M', alert: false, sector: 'Technology' },
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 528.90, change: +4.40, changePct: +0.83, volume: '65.1M', alert: false, sector: 'ETF' },
]

function MiniSparkline({ up }: { up: boolean }) {
  const pts = up
    ? [10, 8, 12, 9, 14, 11, 16, 13, 18, 15, 20]
    : [20, 18, 15, 19, 13, 16, 11, 14, 9, 12, 7]
  const min = Math.min(...pts), max = Math.max(...pts)
  const norm = pts.map(p => 24 - ((p - min) / (max - min)) * 20)
  const path = norm.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * 6} ${y}`).join(' ')
  return (
    <svg width="60" height="24">
      <path d={path} fill="none" stroke={up ? 'var(--bull)' : 'var(--bear)'} strokeWidth="1.5" />
    </svg>
  )
}

export default function WatchlistPage() {
  const [list, setList] = useState(INITIAL_WATCHLIST)
  const [newTicker, setNewTicker] = useState('')
  const [sortBy, setSortBy] = useState<'symbol' | 'change'>('change')
  const [adding, setAdding] = useState(false)

  const sorted = [...list].sort((a, b) => {
    if (sortBy === 'symbol') return a.symbol.localeCompare(b.symbol)
    return Math.abs(b.changePct) - Math.abs(a.changePct)
  })

  const handleAdd = () => {
    const sym = newTicker.toUpperCase().trim()
    if (!sym || list.find(i => i.symbol === sym)) return
    setAdding(true)
    setTimeout(() => {
      setList(prev => [{
        symbol: sym, name: `${sym} Inc`, price: +(150 + Math.random() * 200).toFixed(2),
        change: +(Math.random() * 10 - 5).toFixed(2),
        changePct: +(Math.random() * 4 - 2).toFixed(2),
        volume: `${(10 + Math.random() * 50).toFixed(1)}M`,
        alert: false, sector: 'N/A',
      }, ...prev])
      setNewTicker('')
      setAdding(false)
    }, 600)
  }

  const toggleAlert = (sym: string) => setList(prev => prev.map(i => i.symbol === sym ? { ...i, alert: !i.alert } : i))
  const remove = (sym: string) => setList(prev => prev.filter(i => i.symbol !== sym))

  const gainers = list.filter(i => i.changePct > 0).length
  const losers = list.filter(i => i.changePct < 0).length

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Watchlist</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Track tickers · Set alerts · Monitor market movers</p>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Watching', value: list.length, icon: Star, color: 'var(--accent-blue)' },
          { label: 'Gainers', value: gainers, icon: TrendingUp, color: 'var(--bull)' },
          { label: 'Losers', value: losers, icon: TrendingDown, color: 'var(--bear)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="metric-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
              <Icon size={14} color={color} />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Add + controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Plus size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '30px', width: '180px', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}
            placeholder="ADD TICKER"
            value={newTicker}
            onChange={e => setNewTicker(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          />
        </div>
        <button className="btn-primary" onClick={handleAdd} disabled={adding}>
          {adding ? '⟳' : <><Plus size={13} /> Add</>}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {(['symbol', 'change'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              padding: '5px 12px', borderRadius: '6px',
              border: `1px solid ${sortBy === s ? 'rgba(59,130,246,0.4)' : 'var(--border-muted)'}`,
              background: sortBy === s ? 'rgba(59,130,246,0.1)' : 'transparent',
              color: sortBy === s ? 'var(--accent-blue)' : 'var(--text-muted)',
              fontSize: '11px', fontWeight: '600', cursor: 'pointer',
            }}>
              Sort: {s === 'symbol' ? 'A–Z' : '% Move'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 110px 110px 90px 60px 80px', gap: '0', borderBottom: '1px solid var(--border-muted)', padding: '10px 16px' }}>
          {['Symbol', 'Name', 'Price', 'Change', 'Volume', 'Chart', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        {sorted.map((item, i) => {
          const up = item.changePct >= 0
          return (
            <div
              key={item.symbol}
              style={{
                display: 'grid', gridTemplateColumns: '80px 1fr 110px 110px 90px 60px 80px',
                alignItems: 'center', padding: '12px 16px',
                borderBottom: i < sorted.length - 1 ? '1px solid var(--border-muted)' : 'none',
                transition: 'background 0.15s ease',
              }}
              onMouseOver={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-subtle)'}
              onMouseOut={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>{item.symbol}</span>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{item.name}</div>
                <span style={{ fontSize: '10px', padding: '1px 6px', background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderRadius: '3px', fontFamily: 'JetBrains Mono, monospace' }}>{item.sector}</span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>${item.price.toFixed(2)}</span>
              <div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', fontSize: '12px', color: up ? 'var(--bull)' : 'var(--bear)' }}>
                  {up ? '+' : ''}{item.changePct.toFixed(2)}%
                </span>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {up ? '+' : ''}{item.change.toFixed(2)}
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{item.volume}</span>
              <MiniSparkline up={up} />
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => toggleAlert(item.symbol)}
                  title={item.alert ? 'Alert On' : 'Alert Off'}
                  style={{
                    width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                    background: item.alert ? 'var(--warning-dim)' : 'var(--bg-subtle)',
                    color: item.alert ? 'var(--warning)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  {item.alert ? <Bell size={12} /> : <BellOff size={12} />}
                </button>
                <button
                  onClick={() => remove(item.symbol)}
                  style={{
                    width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                    background: 'var(--bg-subtle)', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bear-dim)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--bear)' }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-subtle)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

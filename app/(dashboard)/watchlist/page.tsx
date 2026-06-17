"use client"

import { useState, useEffect, useCallback } from 'react'
import { Star, TrendingUp, TrendingDown, Plus, Trash2, RefreshCw } from 'lucide-react'

interface WatchlistItem {
  id:         string
  symbol:     string
  assetClass: string
  addedAt:    string
}

interface PriceData {
  price:     number
  change:    number
  changePct: number
  high:      number
  low:       number
  volume:    number
  name:      string
  currency:  string
  loading:   boolean
  error:     boolean
}

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

function formatVol(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

export default function WatchlistPage() {
  const [items,     setItems]     = useState<WatchlistItem[]>([])
  const [prices,    setPrices]    = useState<Record<string, PriceData>>({})
  const [loading,   setLoading]   = useState(true)
  const [newTicker, setNewTicker] = useState('')
  const [adding,    setAdding]    = useState(false)
  const [addError,  setAddError]  = useState('')
  const [sortBy,    setSortBy]    = useState<'symbol' | 'change'>('change')
  const [refreshing, setRefreshing] = useState(false)

  // Fetch price for one symbol
  const fetchPrice = useCallback(async (symbol: string) => {
    setPrices(prev => ({ ...prev, [symbol]: { ...(prev[symbol] ?? {} as any), loading: true, error: false } }))
    try {
      const res  = await fetch(`/api/prices/${symbol}`)
      const data = await res.json()
      if (data.success) {
        setPrices(prev => ({ ...prev, [symbol]: { ...data.data, loading: false, error: false } }))
      } else {
        setPrices(prev => ({ ...prev, [symbol]: { ...(prev[symbol] ?? {} as any), loading: false, error: true } }))
      }
    } catch {
      setPrices(prev => ({ ...prev, [symbol]: { ...(prev[symbol] ?? {} as any), loading: false, error: true } }))
    }
  }, [])

  // Fetch prices for all items
  const refreshAllPrices = useCallback(async (symbols: string[]) => {
    setRefreshing(true)
    await Promise.allSettled(symbols.map(fetchPrice))
    setRefreshing(false)
  }, [fetchPrice])

  // Load watchlist from DB on mount
  useEffect(() => {
    fetch('/api/watchlist')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setItems(d.data)
          // Pre-set loading state so skeleton renders immediately
          const initPrices: Record<string, PriceData> = {}
          d.data.forEach((i: WatchlistItem) => {
            initPrices[i.symbol] = { price: 0, change: 0, changePct: 0, high: 0, low: 0, volume: 0, name: '', currency: '', loading: true, error: false }
          })
          setPrices(initPrices)
          refreshAllPrices(d.data.map((i: WatchlistItem) => i.symbol))
        }
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh prices every 30s
  useEffect(() => {
    if (items.length === 0) return
    const t = setInterval(() => refreshAllPrices(items.map(i => i.symbol)), 30_000)
    return () => clearInterval(t)
  }, [items, refreshAllPrices])

  async function handleAdd() {
    const sym = newTicker.toUpperCase().trim()
    if (!sym) return
    setAdding(true)
    setAddError('')
    try {
      const res  = await fetch('/api/watchlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ symbol: sym }),
      })
      const data = await res.json()
      if (data.success) {
        if (!items.find(i => i.symbol === sym)) {
          setItems(prev => [data.data, ...prev])
          fetchPrice(sym)
        }
        setNewTicker('')
      } else {
        setAddError(data.error || 'Failed to add ticker.')
      }
    } catch {
      setAddError('Network error.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(symbol: string) {
    await fetch(`/api/watchlist/${symbol}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.symbol !== symbol))
    setPrices(prev => { const n = { ...prev }; delete n[symbol]; return n })
  }

  const sorted = [...items].sort((a, b) => {
    if (sortBy === 'symbol') return a.symbol.localeCompare(b.symbol)
    const aChg = Math.abs(prices[a.symbol]?.changePct ?? 0)
    const bChg = Math.abs(prices[b.symbol]?.changePct ?? 0)
    return bChg - aChg
  })

  const gainers = items.filter(i => (prices[i.symbol]?.changePct ?? 0) > 0).length
  const losers  = items.filter(i => (prices[i.symbol]?.changePct ?? 0) < 0).length

  return (
    <div style={{ maxWidth: '920px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Watchlist</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Live prices from Yahoo Finance · Auto-refresh every 30s · Persisted to your account</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Watching', value: items.length, Icon: Star,          color: 'var(--accent-blue)' },
          { label: 'Gainers',  value: gainers,       Icon: TrendingUp,   color: 'var(--bull)'        },
          { label: 'Losers',   value: losers,         Icon: TrendingDown, color: 'var(--bear)'        },
        ].map(({ label, value, Icon, color }) => (
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
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Plus size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="input-field"
                style={{ paddingLeft: '30px', width: '160px', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}
                placeholder="ADD TICKER"
                value={newTicker}
                onChange={e => { setNewTicker(e.target.value); setAddError('') }}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                disabled={adding}
              />
            </div>
            <button className="btn-primary" onClick={handleAdd} disabled={adding || !newTicker.trim()}>
              {adding ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <><Plus size={13} /> Add</>}
            </button>
          </div>
          {addError && <span style={{ fontSize: '11px', color: 'var(--bear)' }}>{addError}</span>}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => refreshAllPrices(items.map(i => i.symbol))}
            disabled={refreshing || items.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border-default)',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh Prices'}
          </button>
          {(['symbol', 'change'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              padding: '6px 12px', borderRadius: '6px',
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
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '52px', borderRadius: '8px' }} />)}
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', border: '1px dashed var(--border-muted)', borderRadius: '12px' }}>
          <Star size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Watchlist is empty.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>Add any ticker above — prices update live from Yahoo Finance.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 120px 120px 90px 70px 60px', gap: '0', borderBottom: '1px solid var(--border-muted)', padding: '10px 16px' }}>
            {['Symbol', 'Name', 'Price', 'Change', 'Volume', 'Chart', ''].map((h, i) => (
              <span key={i} style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {sorted.map((item, idx) => {
            const p   = prices[item.symbol]
            const up  = (p?.changePct ?? 0) >= 0
            const cs  = p?.currency === 'INR' ? '₹' : '$'

            return (
              <div
                key={item.symbol}
                style={{
                  display: 'grid', gridTemplateColumns: '90px 1fr 120px 120px 90px 70px 60px',
                  alignItems: 'center', padding: '12px 16px',
                  borderBottom: idx < sorted.length - 1 ? '1px solid var(--border-muted)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseOver={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-subtle)'}
                onMouseOut={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '800', fontSize: '13px', color: 'var(--text-primary)' }}>
                  {item.symbol}
                </span>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {p?.name ?? item.symbol}
                  </div>
                  <span style={{ fontSize: '10px', padding: '1px 6px', background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderRadius: '3px', fontFamily: 'JetBrains Mono, monospace' }}>
                    {item.assetClass}
                  </span>
                </div>

                {!p || p.loading ? (
                  <div className="skeleton" style={{ height: '16px', width: '70px', borderRadius: '4px' }} />
                ) : p.error ? (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                ) : (
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>
                    {cs}{p.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                )}

                {!p || p.loading ? (
                  <div className="skeleton" style={{ height: '16px', width: '60px', borderRadius: '4px' }} />
                ) : p.error ? (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                ) : (
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', fontSize: '12px', color: up ? 'var(--bull)' : 'var(--bear)' }}>
                      {up ? '+' : ''}{p?.changePct?.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {up ? '+' : ''}{p?.change?.toFixed(2)}
                    </div>
                  </div>
                )}

                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {p?.volume ? formatVol(p.volume) : '—'}
                </span>

                {p && !p.loading && !p.error
                  ? <MiniSparkline up={up} />
                  : <div style={{ width: 60 }} />
                }

                <button
                  onClick={() => handleRemove(item.symbol)}
                  title="Remove"
                  style={{
                    width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                    background: 'var(--bg-subtle)', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--bear-dim)'; b.style.color = 'var(--bear)' }}
                  onMouseOut={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'var(--bg-subtle)'; b.style.color = 'var(--text-muted)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
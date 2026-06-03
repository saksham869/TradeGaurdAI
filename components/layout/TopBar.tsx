"use client"

import { useState, useEffect } from 'react'
import { Bell, Clock, RefreshCw } from 'lucide-react'

interface TickerPrice {
  price:     number
  changePct: number
  loading:   boolean
}

const WATCH_TICKERS = [
  { symbol: 'SPY',     label: 'SPY',  yahooSymbol: 'SPY'     },
  { symbol: 'QQQ',     label: 'QQQ',  yahooSymbol: 'QQQ'     },
  { symbol: 'BTC-USD', label: 'BTC',  yahooSymbol: 'BTC-USD' },
  { symbol: 'USDINR=X',label: '₹',   yahooSymbol: 'USDINR=X' },
]

export default function TopBar() {
  const [prices, setPrices] = useState<Record<string, TickerPrice>>({})
  const [time,   setTime]   = useState(new Date())

  async function fetchPrices() {
    await Promise.allSettled(
      WATCH_TICKERS.map(async t => {
        try {
          const res  = await fetch(`/api/prices/${encodeURIComponent(t.yahooSymbol)}`)
          const data = await res.json()
          if (data.success) {
            setPrices(prev => ({
              ...prev,
              [t.symbol]: { price: data.data.price, changePct: data.data.changePct, loading: false },
            }))
          }
        } catch {
          // keep previous value on error
        }
      })
    )
  }

  useEffect(() => {
    // Set loading state for all tickers
    const initial: Record<string, TickerPrice> = {}
    WATCH_TICKERS.forEach(t => { initial[t.symbol] = { price: 0, changePct: 0, loading: true } })
    setPrices(initial)
    fetchPrices()

    const priceInterval = setInterval(fetchPrices, 60_000)
    const clockInterval = setInterval(() => setTime(new Date()), 1000)
    return () => { clearInterval(priceInterval); clearInterval(clockInterval) }
  }, [])

  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <header style={{
      height: '52px',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-muted)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0,
    }}>
      {/* Live market tickers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {WATCH_TICKERS.map((t, i) => {
          const p = prices[t.symbol]
          const up = (p?.changePct ?? 0) >= 0
          return (
            <div key={t.symbol} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {i > 0 && <div style={{ width: '1px', height: '16px', background: 'var(--border-muted)' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {t.label}
                </span>
                {p?.loading ? (
                  <RefreshCw size={10} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <span style={{
                    fontSize: '11px', fontFamily: 'JetBrains Mono, monospace',
                    color: up ? 'var(--bull)' : 'var(--bear)', fontWeight: '700',
                  }}>
                    {up ? '+' : ''}{p?.changePct?.toFixed(2) ?? '—'}%
                  </span>
                )}
              </div>
            </div>
          )
        })}
        <div style={{ width: '1px', height: '16px', background: 'var(--border-muted)' }} />
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          Live · Yahoo Finance
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
          <Clock size={12} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{timeStr} · {dateStr}</span>
        </div>
        <button style={{
          width: '32px', height: '32px', background: 'var(--bg-subtle)',
          border: '1px solid var(--border-default)', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s ease',
        }}
          onMouseOver={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--border-active)'; b.style.color = 'var(--text-primary)' }}
          onMouseOut={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'var(--border-default)'; b.style.color = 'var(--text-secondary)' }}
        >
          <Bell size={14} />
        </button>
        <div style={{
          width: '32px', height: '32px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: '700', color: 'white', cursor: 'pointer',
        }}>
          T
        </div>
      </div>
    </header>
  )
}
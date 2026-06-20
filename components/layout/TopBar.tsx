"use client"

import { useState, useEffect, useRef } from 'react'
import { Bell, Clock, RefreshCw, Search, Settings, Bot, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { searchPopularSymbols } from '@/lib/data/symbols'

interface TickerPrice {
  price:     number
  changePct: number
  loading:   boolean
}

interface UserProfile {
  name:  string
  email: string
  plan:  string
}

interface TopBarProps {
  onOpenAssistant: () => void
}

const WATCH_TICKERS = [
  { symbol: 'SPY',      label: 'SPY', yahooSymbol: 'SPY'      },
  { symbol: 'QQQ',      label: 'QQQ', yahooSymbol: 'QQQ'      },
  { symbol: 'BTC-USD',  label: 'BTC', yahooSymbol: 'BTC-USD'  },
  { symbol: 'USDINR=X', label: '₹',   yahooSymbol: 'USDINR=X' },
]

export default function TopBar({ onOpenAssistant }: TopBarProps) {
  const router                          = useRouter()
  const [prices,    setPrices]          = useState<Record<string, TickerPrice>>({})
  const [time,      setTime]            = useState(new Date())
  const [searchVal, setSearchVal]       = useState('')
  const [searchOpen, setSearchOpen]     = useState(false)
  const [searchFocus, setSearchFocus]   = useState(0)
  const [profileOpen, setProfileOpen]   = useState(false)
  const [user,       setUser]           = useState<UserProfile | null>(null)
  const searchRef                       = useRef<HTMLDivElement>(null)
  const profileRef                      = useRef<HTMLDivElement>(null)
  const searchInputRef                  = useRef<HTMLInputElement>(null)

  const searchSuggestions = searchVal.length >= 1 ? searchPopularSymbols(searchVal, 6) : searchPopularSymbols('', 6)

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
    const initial: Record<string, TickerPrice> = {}
    WATCH_TICKERS.forEach(t => { initial[t.symbol] = { price: 0, changePct: 0, loading: true } })
    setPrices(initial)
    fetchPrices()

    const priceInterval = setInterval(fetchPrices, 60_000)
    const clockInterval = setInterval(() => setTime(new Date()), 1000)
    return () => { clearInterval(priceInterval); clearInterval(clockInterval) }
  }, [])

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(d => { if (d.success) setUser(d.data) })
      .catch(() => {})
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current  && !searchRef.current.contains(e.target  as Node)) setSearchOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Global keyboard shortcuts
  // ⌘K / Ctrl+K → focus symbol search (symbol-search only — NOT a full command palette)
  // TODO: Full ⌘K command palette (fuzzy search across journal/settings/actions per DESIGN.md 7.4)
  //       is a separate future build. This is symbol-search only for now.
  // ⌘J / Ctrl+J → open Ask TradeGuard assistant panel
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        setSearchOpen(true)
      }
      if (mod && e.key === 'j') {
        e.preventDefault()
        onOpenAssistant()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onOpenAssistant])

  function navigateSearch(symbol: string) {
    if (!symbol.trim()) return
    router.push(`/research?symbol=${encodeURIComponent(symbol.toUpperCase().trim())}`)
    setSearchVal('')
    setSearchOpen(false)
  }

  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'T'

  return (
    <header style={{
      height: '52px',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-muted)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0, gap: '16px',
    }}>
      {/* Live market tickers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
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
      </div>

      {/* Quick search — center */}
      <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            ref={searchInputRef}
            style={{
              width: '100%', padding: '6px 10px 6px 30px',
              background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)',
              borderRadius: '8px', color: 'var(--text-primary)',
              fontSize: '12px', fontFamily: 'JetBrains Mono, monospace',
              outline: 'none', textTransform: 'uppercase',
              transition: 'border-color 0.15s',
            }}
            placeholder="⌘K  Quick search…"
            value={searchVal}
            onChange={e => { setSearchVal(e.target.value); setSearchFocus(0) }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); navigateSearch(searchVal || (searchSuggestions[searchFocus]?.symbol ?? '')) }
              if (e.key === 'ArrowDown') { e.preventDefault(); setSearchFocus(f => Math.min(f + 1, searchSuggestions.length - 1)) }
              if (e.key === 'ArrowUp')   { e.preventDefault(); setSearchFocus(f => Math.max(f - 1, 0)) }
              if (e.key === 'Escape')    setSearchOpen(false)
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        {searchOpen && searchSuggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
            marginTop: '4px', borderRadius: '10px', overflow: 'hidden',
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            {searchSuggestions.map((s, i) => (
              <div
                key={s.symbol}
                onMouseDown={() => navigateSearch(s.symbol)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', cursor: 'pointer',
                  background: i === searchFocus ? 'var(--bg-subtle)' : 'transparent',
                  borderBottom: i < searchSuggestions.length - 1 ? '1px solid var(--border-muted)' : 'none',
                }}
                onMouseEnter={() => setSearchFocus(i)}
              >
                <div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', fontSize: '12px', color: 'var(--text-primary)' }}>{s.symbol}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>{s.name}</span>
                </div>
                <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{s.market}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: clock + bell + profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px' }}>
          <Clock size={11} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{timeStr} · {dateStr}</span>
        </div>

        {/* Ask TradeGuard — ⌘J */}
        <button
          onClick={onOpenAssistant}
          title="Ask TradeGuard (⌘J)"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '0 10px', height: '30px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-default)', borderRadius: '8px',
            cursor: 'pointer', color: 'var(--text-secondary)',
            fontSize: '11px', fontFamily: 'JetBrains Mono, monospace',
            transition: 'all 0.12s',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.color = 'var(--accent-blue)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <Bot size={12} />
          <span style={{ fontWeight: '600' }}>Ask</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>⌘J</span>
        </button>

        <button style={{
          width: '30px', height: '30px', background: 'var(--bg-subtle)',
          border: '1px solid var(--border-default)', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)',
        }}>
          <Bell size={13} />
        </button>

        {/* Profile dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '4px 8px 4px 4px', borderRadius: '10px',
              border: '1px solid var(--border-default)', background: 'var(--bg-subtle)',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            <div style={{
              width: '26px', height: '26px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: '800', color: 'white', flexShrink: 0,
            }}>
              {initials}
            </div>
            {user && (
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
            )}
            <ChevronDown size={11} color="var(--text-muted)" />
          </button>

          {profileOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 300,
              marginTop: '6px', borderRadius: '12px', overflow: 'hidden',
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.5)', minWidth: '220px',
            }}>
              {/* User info */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '800', color: 'white', flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {user?.name ?? 'Demo User'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {user?.email ?? '—'}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
                    background: user?.plan === 'PRO' ? 'rgba(59,130,246,0.15)' : 'var(--bg-subtle)',
                    color: user?.plan === 'PRO' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    border: `1px solid ${user?.plan === 'PRO' ? 'rgba(59,130,246,0.3)' : 'var(--border-muted)'}`,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {user?.plan ?? 'FREE'} PLAN
                  </span>
                  {!user && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Demo Mode
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {[
                { icon: Settings, label: 'Settings',    href: '/settings' },
              ].map(({ icon: Icon, label, href }) => (
                <button
                  key={label}
                  onClick={() => { router.push(href); setProfileOpen(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 16px', background: 'transparent', border: 'none',
                    color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                  onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-subtle)'}
                  onMouseOut={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                >
                  <Icon size={13} color="var(--text-muted)" />
                  {label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--border-muted)', padding: '8px 16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  TradeGuard AI · Demo Mode Active
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

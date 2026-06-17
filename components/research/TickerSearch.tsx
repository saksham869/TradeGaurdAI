"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { searchPopularSymbols } from '@/lib/data/symbols'

export default function TickerSearch({ onSearch }: { onSearch: (ticker: string) => void }) {
  const [ticker,  setTicker]  = useState('')
  const [open,    setOpen]    = useState(false)
  const [focused, setFocused] = useState(0)
  const containerRef          = useRef<HTMLDivElement>(null)

  const suggestions = ticker.length >= 1 ? searchPopularSymbols(ticker, 8) : []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = ticker.trim()
    if (val) { onSearch(val.toUpperCase()); setOpen(false) }
  }

  const pickSuggestion = useCallback((symbol: string) => {
    setTicker(symbol)
    setOpen(false)
    onSearch(symbol)
  }, [onSearch])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)) }
    if (e.key === 'Enter' && open) {
      e.preventDefault()
      pickSuggestion(suggestions[focused].symbol)
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            className="input-field"
            style={{ paddingLeft: '32px', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', width: '100%' }}
            placeholder="Search ticker (AAPL, RELIANCE.NS…)"
            value={ticker}
            onChange={e => { setTicker(e.target.value); setOpen(true); setFocused(0) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button type="submit" className="btn-primary">Analyze</button>
      </form>

      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          marginTop: '4px', borderRadius: '10px', overflow: 'hidden',
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={s.symbol}
              onMouseDown={() => pickSuggestion(s.symbol)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 14px', cursor: 'pointer',
                background: i === focused ? 'var(--bg-subtle)' : 'transparent',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-muted)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={() => setFocused(i)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)', minWidth: '110px' }}>
                  {s.symbol}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.name}</span>
              </div>
              <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}>
                {s.market}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

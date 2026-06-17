"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, TrendingUp, TrendingDown, AlertTriangle, Shield, Search } from 'lucide-react'
import { searchPopularSymbols } from '@/lib/data/symbols'

interface Props {
  onClose: () => void
  onCreated: (position: any) => void
}

const ASSET_CLASSES = ['STOCK', 'CRYPTO', 'FOREX', 'ETF']
const PORTFOLIO_KEY = 'tradeguard_portfolio_value'

export default function NewPositionModal({ onClose, onCreated }: Props) {
  const [side, setSide]               = useState<'LONG' | 'SHORT'>('LONG')
  const [symbol, setSymbol]           = useState('')
  const [symbolOpen, setSymbolOpen]   = useState(false)
  const [symbolFocus, setSymbolFocus] = useState(0)
  const symbolRef                     = useRef<HTMLDivElement>(null)
  const [assetClass, setAssetClass]   = useState('STOCK')
  const [entryPrice, setEntryPrice]   = useState('')
  const [quantity, setQuantity]       = useState('')
  const [stopLoss, setStopLoss]       = useState('')
  const [targetPrice, setTarget]      = useState('')
  const [portfolioValue, setPortfolio] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(PORTFOLIO_KEY)
    if (saved) setPortfolio(saved)
  }, [])

  const symbolSuggestions = symbol.length >= 1 ? searchPopularSymbols(symbol, 6) : []

  const pickSymbol = useCallback((sym: string) => {
    setSymbol(sym)
    setSymbolOpen(false)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (symbolRef.current && !symbolRef.current.contains(e.target as Node)) setSymbolOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Risk calculation
  const positionSize  = parseFloat(entryPrice) * parseFloat(quantity)
  const portfolioNum  = parseFloat(portfolioValue)
  const riskPct       = portfolioNum > 0 && positionSize > 0 ? (positionSize / portfolioNum) * 100 : null
  const riskTooHigh   = riskPct !== null && riskPct > 5
  const riskWarning   = riskPct !== null && riskPct > 2 && riskPct <= 5
  const safeQty       = portfolioNum > 0 && parseFloat(entryPrice) > 0
    ? Math.floor((portfolioNum * 0.02) / parseFloat(entryPrice))
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!symbol || !entryPrice || !quantity) {
      setError('Symbol, entry price, and quantity are required.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol:      symbol.toUpperCase().trim(),
          side,
          assetClass,
          entryPrice:  parseFloat(entryPrice),
          quantity:    parseFloat(quantity),
          stopLoss:    stopLoss    ? parseFloat(stopLoss)    : null,
          targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Failed to create position'); return }
      onCreated(data.data)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(8,11,18,0.85)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="glass-card" style={{ width: '440px', padding: '28px', position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Open Position</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Copilot activates the moment you submit</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Side toggle */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Direction</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['LONG', 'SHORT'] as const).map(s => (
                <button key={s} type="button" onClick={() => setSide(s)} style={{
                  flex: 1, padding: '10px', borderRadius: '8px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  fontSize: '13px', fontWeight: '700', transition: 'all 0.15s ease',
                  background: side === s
                    ? s === 'LONG' ? 'var(--bull-dim)' : 'var(--bear-dim)'
                    : 'var(--bg-subtle)',
                  color: side === s
                    ? s === 'LONG' ? 'var(--bull)' : 'var(--bear)'
                    : 'var(--text-muted)',
                  border: `1px solid ${side === s ? (s === 'LONG' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--border-muted)'}`,
                }}>
                  {s === 'LONG' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Symbol + Asset Class */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div ref={symbolRef} style={{ position: 'relative' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Symbol</label>
              <input className="input-field" placeholder="AAPL" value={symbol}
                onChange={e => { setSymbol(e.target.value.toUpperCase()); setSymbolOpen(true); setSymbolFocus(0) }}
                onFocus={() => setSymbolOpen(true)}
                onKeyDown={e => {
                  if (!symbolOpen || !symbolSuggestions.length) return
                  if (e.key === 'ArrowDown')  { e.preventDefault(); setSymbolFocus(f => Math.min(f + 1, symbolSuggestions.length - 1)) }
                  if (e.key === 'ArrowUp')    { e.preventDefault(); setSymbolFocus(f => Math.max(f - 1, 0)) }
                  if (e.key === 'Enter')      { e.preventDefault(); pickSymbol(symbolSuggestions[symbolFocus].symbol) }
                  if (e.key === 'Escape')     setSymbolOpen(false)
                }}
                autoComplete="off"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '600', width: '100%' }} />
              {symbolOpen && symbolSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                  marginTop: '4px', borderRadius: '8px', overflow: 'hidden',
                  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}>
                  {symbolSuggestions.map((s, i) => (
                    <div
                      key={s.symbol}
                      onMouseDown={() => pickSymbol(s.symbol)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', cursor: 'pointer',
                        background: i === symbolFocus ? 'var(--bg-subtle)' : 'transparent',
                        borderBottom: i < symbolSuggestions.length - 1 ? '1px solid var(--border-muted)' : 'none',
                      }}
                      onMouseEnter={() => setSymbolFocus(i)}
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
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asset</label>
              <select className="input-field" value={assetClass} onChange={e => setAssetClass(e.target.value)}>
                {ASSET_CLASSES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Entry + Quantity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Entry Price</label>
              <input className="input-field" type="number" step="any" placeholder="192.40"
                value={entryPrice} onChange={e => setEntryPrice(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quantity</label>
              <input className="input-field" type="number" step="any" placeholder="100"
                value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
          </div>

          {/* Stop + Target */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--bear)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stop Loss</label>
              <input className="input-field" type="number" step="any" placeholder="190.00"
                value={stopLoss} onChange={e => setStopLoss(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--bull)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target</label>
              <input className="input-field" type="number" step="any" placeholder="197.00"
                value={targetPrice} onChange={e => setTarget(e.target.value)} />
            </div>
          </div>

          {/* Portfolio value for risk calculation */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <Shield size={10} /> Portfolio Value (for risk check)
            </label>
            <input className="input-field" type="number" step="any" placeholder="e.g. 10000 (optional)"
              value={portfolioValue}
              onChange={e => { setPortfolio(e.target.value); localStorage.setItem(PORTFOLIO_KEY, e.target.value) }} />
          </div>

          {/* Risk warning */}
          {riskPct !== null && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px',
              padding: '10px 12px', borderRadius: '8px', marginBottom: '12px',
              background: riskTooHigh ? 'var(--bear-dim)' : riskWarning ? 'var(--warning-dim)' : 'var(--bull-dim)',
              border: `1px solid ${riskTooHigh ? 'rgba(239,68,68,0.25)' : riskWarning ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.2)'}`,
            }}>
              {riskTooHigh || riskWarning
                ? <AlertTriangle size={13} color={riskTooHigh ? 'var(--bear)' : 'var(--warning)'} style={{ flexShrink: 0, marginTop: '1px' }} />
                : <Shield size={13} color="var(--bull)" style={{ flexShrink: 0, marginTop: '1px' }} />
              }
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: riskTooHigh ? 'var(--bear)' : riskWarning ? 'var(--warning)' : 'var(--bull)', marginBottom: '2px' }}>
                  Position Risk: {riskPct.toFixed(1)}% of portfolio
                  {riskTooHigh ? ' — HIGH RISK' : riskWarning ? ' — Elevated' : ' — Safe'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {riskTooHigh
                    ? `Professional traders risk max 1–2% per trade. ${safeQty !== null ? `Reduce to ${safeQty} shares for 2% risk.` : 'Reduce quantity.'}`
                    : riskWarning
                    ? `Above 2% threshold. Consider reducing.${safeQty !== null ? ` 2% risk = ${safeQty} shares.` : ''}`
                    : 'Within safe risk parameters (under 2%). Good position sizing.'}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: 'var(--bear)', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? 'Opening...' : 'Open Position + Start Copilot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
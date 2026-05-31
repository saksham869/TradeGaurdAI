"use client"

import { useState } from 'react'
import { X, TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  onClose: () => void
  onCreated: (position: any) => void
}

const ASSET_CLASSES = ['STOCK', 'CRYPTO', 'FOREX', 'ETF']

export default function NewPositionModal({ onClose, onCreated }: Props) {
  const [side, setSide]             = useState<'LONG' | 'SHORT'>('LONG')
  const [symbol, setSymbol]         = useState('')
  const [assetClass, setAssetClass] = useState('STOCK')
  const [entryPrice, setEntryPrice] = useState('')
  const [quantity, setQuantity]     = useState('')
  const [stopLoss, setStopLoss]     = useState('')
  const [targetPrice, setTarget]    = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

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
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
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
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Symbol</label>
              <input className="input-field" placeholder="AAPL" value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }} />
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
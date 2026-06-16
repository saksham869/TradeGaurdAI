"use client"

import { useState } from 'react'
import { X, TrendingUp, TrendingDown } from 'lucide-react'

interface Trade {
  id: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  entryPrice: number
  quantity: number
  stopLoss?: number | null
}

interface Props {
  trade: Trade
  onClose: () => void
  onClosed: () => void
}

export default function CloseTradeModal({ trade, onClose, onClosed }: Props) {
  const [exitPrice, setExitPrice] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const exit = parseFloat(exitPrice)
  const pnl = !isNaN(exit)
    ? trade.direction === 'LONG'
      ? (exit - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - exit) * trade.quantity
    : null
  const pnlPct = !isNaN(exit)
    ? trade.direction === 'LONG'
      ? ((exit - trade.entryPrice) / trade.entryPrice) * 100
      : ((trade.entryPrice - exit) / trade.entryPrice) * 100
    : null
  const rMultiple =
    pnl != null && trade.stopLoss != null
      ? pnl / (Math.abs(trade.entryPrice - trade.stopLoss) * trade.quantity)
      : null

  async function handleClose(e: React.FormEvent) {
    e.preventDefault()
    if (!exit || isNaN(exit) || exit <= 0) { setError('Enter a valid exit price'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/positions/${trade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED', exitPrice: exit }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Failed'); return }
      onClosed()
    } catch {
      setError('Network error — try again.')
    } finally {
      setLoading(false)
    }
  }

  const isWin  = pnl != null && pnl > 0
  const isLoss = pnl != null && pnl < 0

  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(8,11,18,0.85)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="glass-card" style={{ width:'380px', padding:'24px', position:'relative' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <div>
            <div style={{ fontSize:'14px', fontWeight:'700', color:'var(--text-primary)' }}>
              Close {trade.direction === 'LONG' ? <TrendingUp size={14} style={{display:'inline',verticalAlign:'middle',color:'var(--bull)'}} /> : <TrendingDown size={14} style={{display:'inline',verticalAlign:'middle',color:'var(--bear)'}} />} {trade.symbol}
            </div>
            <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>Entry ₹{trade.entryPrice} · Qty {trade.quantity}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={16} /></button>
        </div>

        <form onSubmit={handleClose}>
          <div style={{ marginBottom:'16px' }}>
            <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--text-secondary)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Exit Price</label>
            <input className="input-field" type="number" step="any" placeholder={String(trade.entryPrice)} value={exitPrice} onChange={e => setExitPrice(e.target.value)} autoFocus />
          </div>

          {pnl != null && (
            <div style={{ padding:'12px 14px', borderRadius:'8px', marginBottom:'16px', background: isWin ? 'var(--bull-dim)' : isLoss ? 'var(--bear-dim)' : 'var(--bg-subtle)', border: `1px solid ${isWin ? 'rgba(34,197,94,0.25)' : isLoss ? 'rgba(239,68,68,0.25)' : 'var(--border-muted)'}` }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'10px', color:'var(--text-muted)', marginBottom:'2px' }}>P&L</div>
                  <div style={{ fontSize:'13px', fontWeight:'700', fontFamily:'JetBrains Mono,monospace', color: isWin ? 'var(--bull)' : isLoss ? 'var(--bear)' : 'var(--text-secondary)' }}>
                    {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(0)}
                  </div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'10px', color:'var(--text-muted)', marginBottom:'2px' }}>%</div>
                  <div style={{ fontSize:'13px', fontWeight:'700', fontFamily:'JetBrains Mono,monospace', color: isWin ? 'var(--bull)' : isLoss ? 'var(--bear)' : 'var(--text-secondary)' }}>
                    {(pnlPct ?? 0) >= 0 ? '+' : ''}{(pnlPct ?? 0).toFixed(2)}%
                  </div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'10px', color:'var(--text-muted)', marginBottom:'2px' }}>R-Multiple</div>
                  <div style={{ fontSize:'13px', fontWeight:'700', fontFamily:'JetBrains Mono,monospace', color: rMultiple != null ? (rMultiple > 0 ? 'var(--bull)' : 'var(--bear)') : 'var(--text-muted)' }}>
                    {rMultiple != null ? `${rMultiple >= 0 ? '+' : ''}${rMultiple.toFixed(2)}R` : '—'}
                  </div>
                </div>
              </div>
              {rMultiple == null && (
                <div style={{ fontSize:'10px', color:'var(--text-muted)', textAlign:'center', marginTop:'6px' }}>Set a stop loss to calculate R-multiple</div>
              )}
            </div>
          )}

          {error && <div style={{ background:'var(--bear-dim)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', padding:'8px 12px', fontSize:'12px', color:'var(--bear)', marginBottom:'12px' }}>{error}</div>}

          <div style={{ display:'flex', gap:'8px' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex:1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex:2, ...(isLoss ? { background: 'var(--bear-dim)', color: 'var(--bear)' } : {}) } as React.CSSProperties} disabled={loading}>
              {loading ? 'Closing…' : 'Confirm Close'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

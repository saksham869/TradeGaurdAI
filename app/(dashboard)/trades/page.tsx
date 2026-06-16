"use client"

import { useState, useEffect, useCallback } from 'react'
import { Plus, TrendingUp, TrendingDown, X, Star, ChevronUp, ChevronDown } from 'lucide-react'
import CloseTradeModal from '@/components/trades/CloseTradeModal'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Trade {
  id: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  entryPrice: number
  entryTime: string
  exitPrice: number | null
  exitTime: string | null
  quantity: number
  stopLoss: number | null
  takeProfit: number | null
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
  pnl: number | null
  pnlPct: number | null
  rMultiple: number | null
  setupTag: string | null
  regimeAtEntry: string | null
  statedConviction: number | null
  assetClass: string
  notes: string | null
}

const SETUP_TAGS_KEY = 'tg_setup_tags'
const DEFAULT_SETUPS = ['range-reversal', 'breakout-chase', 'earnings-play', 'momentum', 'mean-revert', 'scalp']

const REGIME_COLORS: Record<string, string> = {
  BULL_TREND:  '#22c55e',
  BEAR_TREND:  '#ef4444',
  CHOP:        '#f59e0b',
  CRISIS:      '#f97316',
}

// ─── Conviction stars ────────────────────────────────────────────────────────

function ConvictionStars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display:'flex', gap:'2px' }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(value === n ? 0 : n)}
          style={{ background:'none', border:'none', cursor:'pointer', padding:'1px', color: n <= (hovered || value) ? '#f59e0b' : 'var(--border-muted)' }}>
          <Star size={14} fill={n <= (hovered || value) ? '#f59e0b' : 'none'} />
        </button>
      ))}
    </div>
  )
}

// ─── Regime dot ─────────────────────────────────────────────────────────────

function RegimeDot({ regime }: { regime: string | null }) {
  const color = regime ? (REGIME_COLORS[regime] ?? '#6b7280') : '#6b7280'
  return (
    <span title={regime ?? 'Unknown'} style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
  )
}

// ─── R-Multiple cell ─────────────────────────────────────────────────────────

function RCell({ r }: { r: number | null }) {
  if (r == null) return <span style={{ color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace' }}>—</span>
  const color = r >= 2 ? '#22c55e' : r > 0 ? '#86efac' : r >= -1 ? '#fca5a5' : '#ef4444'
  const bg    = r >= 2 ? 'rgba(34,197,94,0.15)' : r > 0 ? 'rgba(34,197,94,0.07)' : r >= -1 ? 'rgba(239,68,68,0.07)' : 'rgba(239,68,68,0.15)'
  return (
    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'12px', fontWeight:'700', color, background:bg, padding:'2px 6px', borderRadius:'4px' }}>
      {r >= 0 ? '+' : ''}{r.toFixed(2)}R
    </span>
  )
}

// ─── New trade form (inline modal) ───────────────────────────────────────────

function NewTradeModal({ onClose, onCreated, setupTags, onAddTag }: {
  onClose: () => void
  onCreated: () => void
  setupTags: string[]
  onAddTag: (tag: string) => void
}) {
  const [direction, setDirection]     = useState<'LONG' | 'SHORT'>('LONG')
  const [symbol, setSymbol]           = useState('')
  const [assetClass, setAssetClass]   = useState('STOCK')
  const [entryPrice, setEntryPrice]   = useState('')
  const [quantity, setQuantity]       = useState('')
  const [stopLoss, setStopLoss]       = useState('')
  const [takeProfit, setTakeProfit]   = useState('')
  const [setupTag, setSetupTag]       = useState('')
  const [newTag, setNewTag]           = useState('')
  const [showNewTag, setShowNewTag]   = useState(false)
  const [conviction, setConviction]   = useState(0)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!symbol || !entryPrice || !quantity) { setError('Symbol, entry price, and quantity required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol.toUpperCase().trim(),
          direction,
          assetClass,
          entryPrice:       parseFloat(entryPrice),
          quantity:         parseFloat(quantity),
          stopLoss:         stopLoss    ? parseFloat(stopLoss)    : null,
          takeProfit:       takeProfit  ? parseFloat(takeProfit)  : null,
          setupTag:         setupTag    || null,
          statedConviction: conviction  || null,
        }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Failed'); return }
      onCreated()
    } catch {
      setError('Network error — try again.')
    } finally {
      setLoading(false)
    }
  }

  function addNewTag() {
    const tag = newTag.trim().toLowerCase().replace(/\s+/g, '-')
    if (!tag) return
    onAddTag(tag)
    setSetupTag(tag)
    setNewTag('')
    setShowNewTag(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(8,11,18,0.85)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="glass-card" style={{ width:'460px', padding:'28px', position:'relative', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <div style={{ fontSize:'15px', fontWeight:'700', color:'var(--text-primary)' }}>Log Trade</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Direction */}
          <div style={{ marginBottom:'14px' }}>
            <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--text-secondary)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Direction</label>
            <div style={{ display:'flex', gap:'8px' }}>
              {(['LONG','SHORT'] as const).map(d => (
                <button key={d} type="button" onClick={() => setDirection(d)} style={{ flex:1, padding:'9px', borderRadius:'8px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'13px', fontWeight:'700', border:`1px solid ${direction===d ? (d==='LONG' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--border-muted)'}`, background: direction===d ? (d==='LONG' ? 'var(--bull-dim)' : 'var(--bear-dim)') : 'var(--bg-subtle)', color: direction===d ? (d==='LONG' ? 'var(--bull)' : 'var(--bear)') : 'var(--text-muted)' }}>
                  {d==='LONG' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{d}
                </button>
              ))}
            </div>
          </div>

          {/* Symbol + Asset */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
            <div>
              <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--text-secondary)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Symbol</label>
              <input className="input-field" placeholder="RELIANCE.NS" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:'600' }} />
            </div>
            <div>
              <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--text-secondary)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Asset</label>
              <select className="input-field" value={assetClass} onChange={e => setAssetClass(e.target.value)}>
                {['STOCK','ETF','CRYPTO','FOREX'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Entry + Qty */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
            <div>
              <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--text-secondary)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Entry Price</label>
              <input className="input-field" type="number" step="any" placeholder="2950" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--text-secondary)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Quantity</label>
              <input className="input-field" type="number" step="any" placeholder="20" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
          </div>

          {/* Stop + Target */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
            <div>
              <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--bear)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Stop Loss</label>
              <input className="input-field" type="number" step="any" placeholder="2850" value={stopLoss} onChange={e => setStopLoss(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--bull)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Target</label>
              <input className="input-field" type="number" step="any" placeholder="3200" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} />
            </div>
          </div>

          {/* Setup Tag */}
          <div style={{ marginBottom:'14px' }}>
            <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--text-secondary)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Setup Tag</label>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'6px' }}>
              {setupTags.map(tag => (
                <button key={tag} type="button" onClick={() => setSetupTag(setupTag===tag ? '' : tag)} style={{ padding:'4px 10px', borderRadius:'100px', fontSize:'11px', fontWeight:'600', cursor:'pointer', background: setupTag===tag ? 'var(--accent-dim)' : 'var(--bg-subtle)', color: setupTag===tag ? 'var(--accent)' : 'var(--text-muted)', border: `1px solid ${setupTag===tag ? 'rgba(99,102,241,0.3)' : 'var(--border-muted)'}` }}>
                  {tag}
                </button>
              ))}
              <button type="button" onClick={() => setShowNewTag(!showNewTag)} style={{ padding:'4px 10px', borderRadius:'100px', fontSize:'11px', cursor:'pointer', background:'var(--bg-subtle)', color:'var(--text-muted)', border:'1px dashed var(--border-muted)' }}>
                + New
              </button>
            </div>
            {showNewTag && (
              <div style={{ display:'flex', gap:'6px' }}>
                <input className="input-field" placeholder="my-setup" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key==='Enter' && (e.preventDefault(), addNewTag())} style={{ flex:1, fontSize:'12px' }} />
                <button type="button" onClick={addNewTag} className="btn-ghost" style={{ fontSize:'12px', padding:'6px 12px' }}>Add</button>
              </div>
            )}
          </div>

          {/* Conviction */}
          <div style={{ marginBottom:'20px' }}>
            <label style={{ fontSize:'11px', fontWeight:'600', color:'var(--text-secondary)', display:'block', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Conviction</label>
            <ConvictionStars value={conviction} onChange={setConviction} />
          </div>

          {error && <div style={{ background:'var(--bear-dim)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', padding:'8px 12px', fontSize:'12px', color:'var(--bear)', marginBottom:'12px' }}>{error}</div>}

          <div style={{ display:'flex', gap:'8px' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex:1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex:2 }} disabled={loading}>{loading ? 'Logging…' : 'Log Trade'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

type SortKey = 'entryTime' | 'symbol' | 'pnl' | 'rMultiple' | 'status'
type SortDir = 'asc' | 'desc'

export default function TradesPage() {
  const [trades, setTrades]       = useState<Trade[]>([])
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)
  const [closeTarget, setClose]   = useState<Trade | null>(null)
  const [sortKey, setSortKey]     = useState<SortKey>('entryTime')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')
  const [setupTags, setSetupTags] = useState<string[]>(DEFAULT_SETUPS)

  useEffect(() => {
    const saved = localStorage.getItem(SETUP_TAGS_KEY)
    if (saved) {
      try { setSetupTags(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  function addTag(tag: string) {
    setSetupTags(prev => {
      const next = prev.includes(tag) ? prev : [...prev, tag]
      localStorage.setItem(SETUP_TAGS_KEY, JSON.stringify(next))
      return next
    })
  }

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/positions')
      const data = await res.json()
      if (data.success) setTrades(data.data ?? [])
    } catch { /* noop */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...trades].sort((a, b) => {
    let va: number | string | null = a[sortKey] as number | string | null
    let vb: number | string | null = b[sortKey] as number | string | null
    // status: OPEN first by default
    if (sortKey === 'status') { va = a.status; vb = b.status }
    if (va == null) return 1
    if (vb == null) return -1
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  // Open trades at top, then closed
  const open   = sorted.filter(t => t.status === 'OPEN')
  const closed = sorted.filter(t => t.status !== 'OPEN')

  // Summary stats
  const closedTrades  = trades.filter(t => t.status === 'CLOSED')
  const withR         = closedTrades.filter(t => t.rMultiple != null)
  const winRate       = withR.length > 0 ? withR.filter(t => (t.rMultiple ?? 0) > 0).length / withR.length : null
  const expectancyR   = withR.length > 0 ? withR.reduce((s, t) => s + (t.rMultiple ?? 0), 0) / withR.length : null

  function SortBtn({ col }: { col: SortKey }) {
    const active = sortKey === col
    return (
      <button onClick={() => toggleSort(col)} style={{ background:'none', border:'none', cursor:'pointer', color: active ? 'var(--accent)' : 'var(--text-muted)', display:'inline-flex', alignItems:'center', gap:'2px', padding:'0' }}>
        {active && sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
    )
  }

  const th: React.CSSProperties = { padding:'8px 12px', fontSize:'11px', fontWeight:'600', color:'var(--text-muted)', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid var(--border-muted)', whiteSpace:'nowrap' }
  const td: React.CSSProperties = { padding:'10px 12px', fontSize:'12px', color:'var(--text-secondary)', borderBottom:'1px solid var(--border-muted)', whiteSpace:'nowrap' }

  return (
    <div style={{ maxWidth:'1100px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:'700', color:'var(--text-primary)', marginBottom:'4px' }}>Trade Log</h1>
          <p style={{ fontSize:'13px', color:'var(--text-muted)' }}>Track, close, and review every trade. Not financial advice.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary" style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px' }}>
          <Plus size={14} /> Log Trade
        </button>
      </div>

      {/* Summary strip */}
      {closedTrades.length > 0 && (
        <div style={{ display:'flex', gap:'16px', marginBottom:'24px', flexWrap:'wrap' }}>
          {[
            { label:'Closed trades', value: String(closedTrades.length) },
            { label:`Win rate (n=${withR.length})`, value: winRate != null ? `${(winRate*100).toFixed(0)}%` : '—' },
            { label:`Expectancy (n=${withR.length})`, value: expectancyR != null ? `${expectancyR >= 0 ? '+' : ''}${expectancyR.toFixed(2)}R` : '—', color: expectancyR != null ? (expectancyR > 0 ? 'var(--bull)' : 'var(--bear)') : undefined },
            { label:'Open positions', value: String(open.length) },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding:'10px 16px', minWidth:'120px' }}>
              <div style={{ fontSize:'10px', color:'var(--text-muted)', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
              <div style={{ fontSize:'16px', fontWeight:'700', fontFamily:'JetBrains Mono,monospace', color: s.color ?? 'var(--text-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="glass-card" style={{ overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)' }}>Loading…</div>
        ) : trades.length === 0 ? (
          <div style={{ padding:'60px', textAlign:'center', color:'var(--text-muted)' }}>
            <div style={{ marginBottom:'8px', fontSize:'15px' }}>No trades yet</div>
            <div style={{ fontSize:'12px' }}>Click &ldquo;Log Trade&rdquo; to add your first position.</div>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Symbol <SortBtn col="symbol" /></th>
                  <th style={th}>Dir</th>
                  <th style={th}>Setup</th>
                  <th style={th}>Conv</th>
                  <th style={th}>Regime</th>
                  <th style={th}>Entry</th>
                  <th style={th}>Qty</th>
                  <th style={th}>Status <SortBtn col="status" /></th>
                  <th style={th}>P&L <SortBtn col="pnl" /></th>
                  <th style={th}>R <SortBtn col="rMultiple" /></th>
                  <th style={th}>Date <SortBtn col="entryTime" /></th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {[...open, ...closed].map(t => (
                  <tr key={t.id} style={{ opacity: t.status !== 'OPEN' ? 0.8 : 1 }}>
                    <td style={td}>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:'700', color:'var(--text-primary)', fontSize:'13px' }}>{t.symbol}</span>
                    </td>
                    <td style={td}>
                      <span style={{ display:'flex', alignItems:'center', gap:'4px', color: t.direction==='LONG' ? 'var(--bull)' : 'var(--bear)', fontWeight:'700', fontSize:'11px' }}>
                        {t.direction==='LONG' ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {t.direction}
                      </span>
                    </td>
                    <td style={td}>
                      {t.setupTag
                        ? <span style={{ padding:'2px 8px', borderRadius:'100px', background:'var(--accent-dim)', color:'var(--accent)', fontSize:'11px', fontWeight:'600' }}>{t.setupTag}</span>
                        : <span style={{ color:'var(--text-muted)' }}>—</span>
                      }
                    </td>
                    <td style={td}>
                      {t.statedConviction
                        ? <span style={{ color:'#f59e0b', letterSpacing:'1px' }}>{'★'.repeat(t.statedConviction)}{'☆'.repeat(5-t.statedConviction)}</span>
                        : <span style={{ color:'var(--text-muted)' }}>—</span>
                      }
                    </td>
                    <td style={td}>
                      <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                        <RegimeDot regime={t.regimeAtEntry} />
                        <span style={{ fontSize:'10px', color:'var(--text-muted)' }}>{t.regimeAtEntry ?? '—'}</span>
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ fontFamily:'JetBrains Mono,monospace' }}>₹{t.entryPrice.toLocaleString()}</span>
                    </td>
                    <td style={td}>{t.quantity}</td>
                    <td style={td}>
                      <span style={{ padding:'2px 8px', borderRadius:'100px', fontSize:'11px', fontWeight:'600', background: t.status==='OPEN' ? 'rgba(99,102,241,0.15)' : t.status==='CLOSED' ? 'var(--bg-subtle)' : 'var(--bg-subtle)', color: t.status==='OPEN' ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={td}>
                      {t.pnl != null
                        ? <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:'700', color: t.pnl>0 ? 'var(--bull)' : t.pnl<0 ? 'var(--bear)' : 'var(--text-muted)' }}>
                            {t.pnl>=0?'+':''}₹{Math.abs(t.pnl).toFixed(0)}
                          </span>
                        : <span style={{ color:'var(--text-muted)' }}>—</span>
                      }
                    </td>
                    <td style={td}><RCell r={t.rMultiple} /></td>
                    <td style={td}>
                      <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>
                        {new Date(t.entryTime).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                      </span>
                    </td>
                    <td style={td}>
                      {t.status === 'OPEN' && (
                        <button onClick={() => setClose(t)} className="btn-ghost" style={{ fontSize:'11px', padding:'4px 10px', color:'var(--text-muted)' }}>
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'16px', textAlign:'center' }}>
        This is not financial advice. TradeGuard AI never places trades on your behalf.
      </p>

      {showNew && (
        <NewTradeModal
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); fetchTrades() }}
          setupTags={setupTags}
          onAddTag={addTag}
        />
      )}

      {closeTarget && (
        <CloseTradeModal
          trade={closeTarget}
          onClose={() => setClose(null)}
          onClosed={() => { setClose(null); fetchTrades() }}
        />
      )}
    </div>
  )
}

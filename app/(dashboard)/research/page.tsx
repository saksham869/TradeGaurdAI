"use client"

import { useState } from 'react'
import { Search, TrendingUp, TrendingDown, BarChart2, Activity, AlertTriangle, RefreshCw, Zap, Database } from 'lucide-react'
import AITransparencyBadge from '@/components/ui/AITransparencyBadge'

const MARKET_GROUPS = [
  { flag: '🇺🇸', label: 'US Stocks',  color: 'var(--accent-blue)', tickers: ['AAPL', 'NVDA', 'TSLA', 'META', 'MSFT', 'AMZN', 'GOOGL'] },
  { flag: '🇮🇳', label: 'India NSE',  color: 'var(--warning)',     tickers: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO'] },
  { flag: '₿',   label: 'Crypto',     color: '#f7931a',            tickers: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE'] },
  { flag: '💱',  label: 'Forex',      color: 'var(--cyan)',        tickers: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDINR', 'AUDUSD'] },
  { flag: '🪙',  label: 'Commodities',color: '#fbbf24',            tickers: ['XAUUSD', 'XAGUSD', 'CL', 'NG'] },
  { flag: '🌏',  label: 'Global',     color: 'var(--purple)',      tickers: ['VOD.L', 'SAP.DE', 'ASML.AS', '7203.T'] },
]

function MiniChart({ positive }: { positive: boolean }) {
  const pts = positive
    ? [40, 35, 42, 38, 45, 43, 50, 48, 55, 52, 60]
    : [60, 55, 52, 58, 48, 45, 42, 46, 38, 35, 30]
  const max = Math.max(...pts), min = Math.min(...pts)
  const norm = pts.map(p => 44 - ((p - min) / (max - min)) * 40)
  const path = norm.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * 10} ${y}`).join(' ')
  return (
    <svg width="100" height="44">
      <path d={path} fill="none" stroke={positive ? 'var(--bull)' : 'var(--bear)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const REC_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  FAVORABLE:            { color: 'var(--bull)',        bg: 'var(--bull-dim)',        border: 'rgba(34,197,94,0.25)'  },
  PROCEED_WITH_CAUTION: { color: 'var(--warning)',      bg: 'var(--warning-dim)',     border: 'rgba(245,158,11,0.25)' },
  WAIT:                 { color: 'var(--warning)',      bg: 'var(--warning-dim)',     border: 'rgba(245,158,11,0.25)' },
  HIGH_RISK:            { color: 'var(--bear)',         bg: 'var(--bear-dim)',        border: 'rgba(239,68,68,0.25)'  },
  STRONG_AVOID:         { color: 'var(--bear)',         bg: 'var(--bear-dim)',        border: 'rgba(239,68,68,0.25)'  },
}

// ─── Foundry IQ citation badge strip ─────────────────────────────────────────

function FoundryIQPanel({ foundryIQ }: { foundryIQ?: { available: boolean; citations: string[]; resultCount: number } }) {
  if (!foundryIQ?.available) return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 9px', borderRadius: '5px', marginBottom: '8px',
      background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)',
    }}>
      <Database size={10} color="var(--text-muted)" />
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
        Foundry IQ not configured — add AZURE_SEARCH_ENDPOINT to .env
      </span>
    </div>
  )

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '3px 10px', borderRadius: '5px',
          background: 'rgba(0,120,212,0.1)', border: '1px solid rgba(0,120,212,0.25)',
        }}>
          <Database size={10} color="#0078D4" />
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#0078D4', fontFamily: 'JetBrains Mono, monospace' }}>
            Azure Foundry IQ · {foundryIQ.resultCount} docs retrieved
          </span>
        </div>
        {foundryIQ.citations.map((c, i) => (
          <span key={i} style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
            background: 'rgba(0,120,212,0.07)', color: '#0078D4',
            border: '1px solid rgba(0,120,212,0.18)',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            [{i + 1}] {c}
          </span>
        ))}
      </div>
    </div>
  )
}

function AnalysisPanel({ symbol, data }: { symbol: string; data: any }) {
  const mi  = data.marketInfo || {}
  const cs  = mi.currencySymbol || '$'
  const isUp = (data.changePct ?? 0) >= 0
  const rec  = data.synthesis?.recommendation ?? 'PROCEED_WITH_CAUTION'
  const rs   = REC_STYLE[rec] ?? REC_STYLE['PROCEED_WITH_CAUTION']

  return (
    <div className="slide-in" style={{ marginTop: '20px' }}>
      {/* Price card */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>{mi.name || symbol}</span>
          <span style={{ fontSize: '10px', padding: '2px 7px', background: 'var(--bg-subtle)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700' }}>{mi.exchange || '—'}</span>
          <span style={{ fontSize: '10px', padding: '2px 7px', background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>{mi.currency || 'USD'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
                {cs}{(data.price ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: isUp ? 'var(--bull)' : 'var(--bear)' }}>
                {isUp ? '+' : ''}{(data.changePct ?? 0).toFixed(2)}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[['H', mi.high != null ? `${cs}${mi.high.toFixed?.(2) ?? mi.high}` : '—'],
                ['L', mi.low  != null ? `${cs}${mi.low.toFixed?.(2)  ?? mi.low}`  : '—'],
                ['Vol', mi.volume   || '—'],
                ['Cap', mi.marketCap || '—']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{k}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <MiniChart positive={isUp} />
            <span style={{
              fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '6px',
              color: rs.color, background: rs.bg, border: `1px solid ${rs.border}`,
              fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
            }}>
              {rec.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* News + Technical */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <BarChart2 size={11} /> News Impact
          </div>
          {data.newsImpact?.headline && (
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: '1.5' }}>
              {data.newsImpact.headline}
            </p>
          )}
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {data.newsImpact?.newsImpact || data.newsImpact?.whatItMeans || 'No recent news catalyst identified.'}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Activity size={11} /> Technical Read
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            {[
              ['Trend',      data.technicalRead?.trend ?? data.technicalRead?.technicalBias ?? '—'],
              ['RSI',        data.technicalRead?.rsi ?? '—'],
              ['Support',    data.technicalRead?.support1 != null ? `${cs}${(+data.technicalRead.support1).toLocaleString()}` : '—'],
              ['Resistance', data.technicalRead?.resistance1 != null ? `${cs}${(+data.technicalRead.resistance1).toLocaleString()}` : '—'],
            ].map(([k, v]) => (
              <div key={k as string} style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '8px' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>{k}</div>
                <div style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{v}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {data.technicalRead?.technicalSummary || data.technicalRead?.summary || '—'}
          </p>
        </div>
      </div>

      {/* Retail trap */}
      {data.retailTrapAnalysis?.trapActive ? (
        <div style={{ background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--bear)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={11} /> Active Retail Trap Detected
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: '1.6' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Mistake: </strong>{data.retailTrapAnalysis.retailMistake}
          </p>
          {data.retailTrapAnalysis.institutionalView && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Smart money: </strong>{data.retailTrapAnalysis.institutionalView}
            </p>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--bull-dim)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={14} color="var(--bull)" />
          <span style={{ fontSize: '12px', color: 'var(--bull)', fontWeight: '600' }}>No active retail traps identified for {symbol}.</span>
        </div>
      )}

      {/* Synthesis + Foundry IQ */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Zap size={11} /> AI Synthesis — Azure GPT-4o
          </div>
          <AITransparencyBadge
            model="Azure OpenAI GPT-4o"
            task="Multi-agent synthesis grounded by Azure AI Foundry IQ knowledge retrieval"
            inputSummary={`Ticker: ${symbol} · Live Yahoo Finance price · Perplexity news · 3 Claude agent analyses · ${data.foundryIQ?.available ? `${data.foundryIQ.resultCount} Foundry IQ docs retrieved` : 'Foundry IQ not configured'}`}
          />
        </div>

        {/* Foundry IQ grounding strip */}
        <FoundryIQPanel foundryIQ={data.foundryIQ} />

        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.7', marginBottom: data.foundryIQ?.available ? '12px' : '0' }}>
          {data.synthesis?.summary ?? data.synthesis?.recommendationReason ?? '—'}
        </p>

        {/* Citation badges */}
        {data.foundryIQ?.available && data.foundryIQ.citations.length > 0 && (
          <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-muted)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Database size={10} /> Grounded by Azure AI Foundry IQ · financial-knowledge index
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {data.foundryIQ.citations.map((c: string, i: number) => (
                <span key={i} style={{
                  fontSize: '11px', padding: '3px 10px', borderRadius: '5px',
                  background: 'rgba(0,120,212,0.08)', color: '#0078D4',
                  border: '1px solid rgba(0,120,212,0.2)',
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: '600',
                }}>
                  [{i + 1}] {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResearchPage() {
  const [ticker,  setTicker]  = useState('')
  const [symbol,  setSymbol]  = useState('')
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSearch = async (sym: string) => {
    const s = sym.toUpperCase().trim()
    if (!s) return
    setSymbol(s)
    setError(null)
    setLoading(true)
    setData(null)

    try {
      const res  = await fetch(`/api/research/${encodeURIComponent(s)}`)
      const json = await res.json()

      if (json.success && json.data) {
        const d  = json.data
        const mi = d.marketInfo || {}
        setData({
          price:      d.priceAtAnalysis ?? 0,
          change:     mi.change ?? 0,
          changePct:  mi.changePct ?? 0,
          marketInfo: {
            name:           mi.name         || s,
            exchange:       mi.exchange     || 'Global',
            currency:       mi.currency     || 'USD',
            currencySymbol: mi.currencySymbol || '$',
            market:         mi.market       || 'US',
            volume:         mi.volume       || 'N/A',
            marketCap:      mi.marketCap    || 'N/A',
            high:           mi.high         ?? d.priceAtAnalysis,
            low:            mi.low          ?? d.priceAtAnalysis,
          },
          newsImpact:          d.newsImpact,
          technicalRead:       d.technicalRead,
          retailTrapAnalysis:  d.retailTrapAnalysis,
          synthesis:           d.synthesis,
          foundryIQ:           d.foundryIQ,
        })
      } else {
        setError(json.error || `Could not load analysis for ${s}.`)
      }
    } catch {
      setError('Network error — make sure the dev server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '920px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Research Terminal</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Live multi-agent analysis · US · India NSE/BSE · Crypto · Forex · Commodities</p>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '36px', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}
            placeholder="TICKER — e.g. AAPL, RELIANCE, BTC"
            value={ticker}
            onChange={e => setTicker(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(ticker) }}
          />
        </div>
        <button className="btn-primary" onClick={() => handleSearch(ticker)} disabled={loading}>
          {loading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : 'Analyze'}
        </button>
      </div>

      {/* Quick tickers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
        {MARKET_GROUPS.map(group => (
          <div key={group.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '100px', flexShrink: 0 }}>
              <span style={{ fontSize: '13px' }}>{group.flag}</span>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{group.label}</span>
            </div>
            {group.tickers.map(t => (
              <button key={t} onClick={() => { setTicker(t); handleSearch(t) }} disabled={loading}
                style={{
                  padding: '3px 10px', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer',
                  border: `1px solid ${group.color}30`, background: `${group.color}08`, color: group.color,
                  fontSize: '11px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace',
                  transition: 'all 0.15s ease', opacity: loading ? 0.5 : 1,
                }}
                onMouseOver={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = `${group.color}20` }}
                onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = `${group.color}08` }}
              >
                {t}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="slide-in" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            <RefreshCw size={16} color="var(--accent-blue)" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'var(--accent-blue)', fontWeight: '700', fontSize: '14px', fontFamily: 'JetBrains Mono, monospace' }}>
              Analyzing {symbol}...
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            Fetching live price from Yahoo Finance<br />
            Running news research · Technical analysis · Retail trap detection<br />
            Azure GPT-4o synthesis
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ padding: '16px 20px', background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
          <p style={{ color: 'var(--bear)', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
            Analysis failed for {symbol}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{error}</p>
        </div>
      )}

      {/* Live badge + results */}
      {data && !loading && (
        <>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '6px', background: 'var(--bull-dim)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--bull)', display: 'block', animation: 'pulse-dot 2s infinite' }} />
            <span style={{ fontSize: '11px', color: 'var(--bull)', fontWeight: '600' }}>Live Analysis · Azure GPT-4o</span>
          </div>
          <AnalysisPanel symbol={symbol} data={data} />
        </>
      )}

      {/* Empty state */}
      {!symbol && !loading && (
        <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed var(--border-muted)', borderRadius: '12px' }}>
          <Search size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Enter any ticker above for live multi-agent analysis</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>Powered by Azure GPT-4o · Yahoo Finance · Real-time data</p>
        </div>
      )}
    </div>
  )
}
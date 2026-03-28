"use client"

import { useState } from 'react'
import { Search, TrendingUp, TrendingDown, BarChart2, Activity, AlertTriangle } from 'lucide-react'

const MARKET_GROUPS = [
  {
    flag: '🇺🇸', label: 'US Stocks', color: 'var(--accent-blue)',
    tickers: ['AAPL', 'NVDA', 'TSLA', 'META', 'MSFT', 'AMZN', 'GOOGL'],
  },
  {
    flag: '🇮🇳', label: 'India NSE', color: 'var(--warning)',
    tickers: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'BAJFINANCE'],
  },
  {
    flag: '₿', label: 'Crypto', color: '#f7931a',
    tickers: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'AVAX', 'MATIC'],
  },
  {
    flag: '💱', label: 'Forex', color: 'var(--cyan)',
    tickers: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDINR', 'USDCHF', 'AUDUSD', 'USDCAD'],
  },
  {
    flag: '🪙', label: 'Commodities', color: '#fbbf24',
    tickers: ['XAUUSD', 'XAGUSD', 'CL', 'NG', 'GC', 'SI'],
  },
  {
    flag: '🌏', label: 'Global', color: 'var(--purple)',
    tickers: ['VOD.L', 'BP.L', 'SAP.DE', 'ASML.AS', '7203.T', '005930.KS'],
  },
]

const MOCK_ANALYSES: Record<string, any> = {
  AAPL: {
    price: 185.92, change: +1.23, changePct: +0.67,
    marketInfo: { name: 'Apple Inc', exchange: 'NASDAQ', currency: 'USD', currencySymbol: '$', market: 'US', volume: '52.4M', marketCap: '$2.87T', high: 187.10, low: 184.50 },
    newsImpact: { headline: 'Apple explores AI partnership with Google for iPhone features', newsImpact: 'If confirmed, this deal signals Apple is willing to license AI externally rather than build in-house — massive usage boost for Gemini. Near-term positive for AAPL as it removes R&D risk.', sentimentScore: 71, sentimentLabel: 'BULLISH' },
    technicalRead: { trend: 'UPTREND', support1: 179.80, resistance1: 191.50, rsi: 61, technicalSummary: 'AAPL trading above all major MAs. RSI at 61 shows room to run. Consolidation between $182–$187 looks like a bull flag.', technicalBias: 'BULLISH' },
    retailTrapAnalysis: { trapActive: false },
    synthesis: { recommendation: 'FAVORABLE', summary: 'Solid setup with low trap risk. Institutional positioning is net long.' },
  },
  RELIANCE: {
    price: 2847.50, change: +43.20, changePct: +1.54,
    marketInfo: { name: 'Reliance Industries Ltd', exchange: 'NSE', currency: 'INR', currencySymbol: '₹', market: 'NSE', volume: '8.2M', marketCap: '₹19.2T', high: 2865.00, low: 2820.00 },
    newsImpact: { headline: 'Reliance Jio 5G rollout accelerates — 700M subscriber target by Q2 FY25', newsImpact: 'Jio\'s aggressive 5G expansion puts pressure on Airtel and Vi. Reliance\'s telecom segment now contributes 32% of EBITDA — up from 21% two years ago. Margin expansion expected.', sentimentScore: 74, sentimentLabel: 'BULLISH' },
    technicalRead: { trend: 'UPTREND', support1: 2760, resistance1: 2900, rsi: 64, technicalSummary: 'RELIANCE breaking out of a 3-month base pattern on the daily chart. RSI at 64 — not yet overbought. Key resistance at ₹2,900 is the next level to watch.', technicalBias: 'BULLISH' },
    retailTrapAnalysis: { trapActive: false },
    synthesis: { recommendation: 'FAVORABLE', summary: 'Strong fundamental + technical alignment. Retail accumulation healthy, no trap signals.' },
  },
  TCS: {
    price: 3912.30, change: -28.50, changePct: -0.72,
    marketInfo: { name: 'Tata Consultancy Services', exchange: 'NSE', currency: 'INR', currencySymbol: '₹', market: 'NSE', volume: '3.1M', marketCap: '₹14.2T', high: 3950.00, low: 3895.00 },
    newsImpact: { headline: 'TCS Q3 miss on margins — Europe deals slowdown hits revenue growth', newsImpact: 'TCS reported 4.5% revenue growth vs 5.8% estimate. Europe banking sector deals pushed to Q4. Management guided for recovery in H2 but tone was cautious.', sentimentScore: 38, sentimentLabel: 'BEARISH' },
    technicalRead: { trend: 'DOWNTREND', support1: 3800, resistance1: 3980, rsi: 42, technicalSummary: 'TCS broke below the 50-day MA on earnings day on 2x volume. RSI at 42 — not yet oversold. Watch ₹3,800 as the next key support.', technicalBias: 'BEARISH' },
    retailTrapAnalysis: { trapActive: true, retailMistake: 'Retail is buying TCS dip on "conviction" after H2 recovery guidance — without seeing if Q4 guidance holds. Insiders sold ₹420Cr worth of shares last month.', institutionalView: 'FIIs net sellers for 3rd consecutive week. DIIs absorbing but not aggressively.' },
    synthesis: { recommendation: 'HIGH_RISK', summary: 'Margin pressure + weak Europe outlook. Risk/reward unfavorable until Q4 numbers confirm recovery.' },
  },
  INFY: {
    price: 1478.60, change: +12.30, changePct: +0.84,
    marketInfo: { name: 'Infosys Ltd', exchange: 'NSE', currency: 'INR', currencySymbol: '₹', market: 'NSE', volume: '5.4M', marketCap: '₹6.1T', high: 1490.00, low: 1462.00 },
    newsImpact: { headline: 'Infosys raises FY25 revenue guidance to 4.5–5% after strong Q3 deal wins', newsImpact: 'INFY beat Q3 estimates and raised full-year guidance — a rare positive in a sector under margin pressure. Large deal TCV of $2.1B was 40% above expectations.', sentimentScore: 78, sentimentLabel: 'BULLISH' },
    technicalRead: { trend: 'UPTREND', support1: 1430, resistance1: 1520, rsi: 67, technicalSummary: 'INFY reclaiming the 200-day MA after 4 months below it. Breakout on above-average volume post-earnings. RSI at 67 — momentum intact.', technicalBias: 'BULLISH' },
    retailTrapAnalysis: { trapActive: false },
    synthesis: { recommendation: 'FAVORABLE', summary: 'Guidance raise + deal win momentum makes INFY the sector leader. Better risk/reward than TCS currently.' },
  },
  NVDA: {
    price: 875.40, change: +52.80, changePct: +6.42,
    marketInfo: { name: 'NVIDIA Corp', exchange: 'NASDAQ', currency: 'USD', currencySymbol: '$', market: 'US', volume: '89.2M', marketCap: '$2.16T', high: 882.00, low: 850.00 },
    newsImpact: { headline: 'NVIDIA Q4 Earnings: $22.1B Revenue, Data Center +409% YoY', newsImpact: 'Historic beat driven entirely by AI infrastructure buildout. H100/H200 supply constrained through mid-2025, providing revenue visibility.', sentimentScore: 85, sentimentLabel: 'BULLISH' },
    technicalRead: { trend: 'STRONG UPTREND', support1: 820, resistance1: 925, rsi: 72, technicalSummary: 'NVDA gapping up on record volume post-earnings. RSI at 72 technically overbought but can stay elevated in strong breakouts.', technicalBias: 'BULLISH' },
    retailTrapAnalysis: { trapActive: true, retailMistake: 'Buying market open after a 6% gap is classic retail FOMO. Smart money bought pre-earnings. Gap fills happen 70% of the time within 2 weeks.', institutionalView: 'Institutions still long but trimming into the gap. Large put buying above $900 — hedging.' },
    synthesis: { recommendation: 'WAIT', summary: 'Strong fundamental story but tactically extended. Wait for gap fill before entry.' },
  },
  TSLA: {
    price: 176.40, change: -12.30, changePct: -6.52,
    marketInfo: { name: 'Tesla Inc', exchange: 'NASDAQ', currency: 'USD', currencySymbol: '$', market: 'US', volume: '143.2M', marketCap: '$561B', high: 190.00, low: 174.00 },
    newsImpact: { headline: 'Tesla surprise equity offering of $3B — dilution spooks investors', newsImpact: 'Dilutive raise signals cash burn concerns. Equity dilution adds $42/share overhead pressure.', sentimentScore: 25, sentimentLabel: 'BEARISH' },
    technicalRead: { trend: 'DOWNTREND', support1: 168, resistance1: 183, rsi: 28, technicalSummary: 'TSLA broke below the 200-day MA on 3x average volume — strong distribution signal. RSI at 28 nearing oversold but no confirmation of bottom yet.', technicalBias: 'BEARISH' },
    retailTrapAnalysis: { trapActive: true, retailMistake: 'Retail buying the dip aggressively — Robinhood shows 4.2M new buyers today. Classic bag-holder accumulation during institutional exit.', institutionalView: 'Net sellers on dark pools. Multiple hedge funds exiting in Q4. Goldman lowered target to $165.' },
    synthesis: { recommendation: 'STRONG_AVOID', summary: 'Active retail trap. Distribution in progress. No technical support confirmed yet.' },
  },
  BTC: {
    price: 68420.50, change: 1820.30, changePct: 2.73,
    marketInfo: { name: 'Bitcoin', exchange: 'Crypto', currency: 'USD', currencySymbol: '$', market: 'CRYPTO', volume: '38.4B', marketCap: '$1.34T', high: 69200, low: 67100 },
    newsImpact: { headline: 'Bitcoin ETF inflows hit $1.2B in single day — BlackRock leads institutional surge', newsImpact: 'Spot ETF inflows signal sustained institutional demand. BlackRock IBIT now holds 270,000+ BTC. Supply from miners absorbed faster than created.', sentimentScore: 80, sentimentLabel: 'BULLISH' },
    technicalRead: { trend: 'STRONG UPTREND', support1: 64000, resistance1: 72000, rsi: 68, technicalSummary: 'BTC holding above $65K support post-halving. RSI at 68 — momentum without extreme overbought. Next key level: ATH at $73,800.', technicalBias: 'BULLISH' },
    retailTrapAnalysis: { trapActive: true, retailMistake: 'Retail FOMO buying at cycle highs without stop losses. Social media hype at 9/10 — historically a caution signal for new entries.', institutionalView: 'Institutions accumulating via ETFs steadily, not chasing. Long-term holders not selling.' },
    synthesis: { recommendation: 'PROCEED_WITH_CAUTION', summary: 'Bullish macro setup but RSI extended. Dollar-cost averaging preferred over lump-sum at current levels.' },
  },
  ETH: {
    price: 3248.70, change: 84.20, changePct: 2.66,
    marketInfo: { name: 'Ethereum', exchange: 'Crypto', currency: 'USD', currencySymbol: '$', market: 'CRYPTO', volume: '14.2B', marketCap: '$390B', high: 3310, low: 3180 },
    newsImpact: { headline: 'Ethereum Dencun upgrade reduces L2 gas fees by 90% — Base and Arbitrum surge', newsImpact: 'Dencun makes L2s dramatically cheaper, increasing throughput. Bullish for ETH as it captures more economic activity and staking yield holds.', sentimentScore: 75, sentimentLabel: 'BULLISH' },
    technicalRead: { trend: 'UPTREND', support1: 3100, resistance1: 3400, rsi: 62, technicalSummary: 'ETH consolidating between $3,100 and $3,400 post-upgrade. RSI at 62 — healthy. Clean break above $3,400 targets $3,800.', technicalBias: 'BULLISH' },
    retailTrapAnalysis: { trapActive: false },
    synthesis: { recommendation: 'FAVORABLE', summary: 'Strong technical + protocol catalyst. ETH underperforming BTC offers a catch-up opportunity.' },
  },
  EURUSD: {
    price: 1.0842, change: -0.0023, changePct: -0.21,
    marketInfo: { name: 'Euro / US Dollar', exchange: 'Forex', currency: 'USD', currencySymbol: '', market: 'FOREX', volume: '$7.2T/day', marketCap: 'N/A', high: 1.089, low: 1.082 },
    newsImpact: { headline: 'ECB holds rates, signals June cut — EUR weakens vs USD', newsImpact: 'ECB dovish pivot is earlier than Fed. Rate differential favors USD near-term. EUR/USD could test 1.07 if next US CPI comes in hot.', sentimentScore: 35, sentimentLabel: 'BEARISH' },
    technicalRead: { trend: 'DOWNTREND', support1: 1.078, resistance1: 1.092, rsi: 41, technicalSummary: 'EUR/USD broke below 1.0850 support on ECB announcement. RSI at 41. Bears target 1.0780 next.', technicalBias: 'BEARISH' },
    retailTrapAnalysis: { trapActive: true, retailMistake: 'Retail buying EUR/USD as a cheap dip without understanding that rate differential is structural, not temporary.', institutionalView: 'FX desks short EUR/USD targeting 1.07. No reversal catalyst until Fed pivots.' },
    synthesis: { recommendation: 'HIGH_RISK', summary: 'Macro and technical both bearish. Avoid long EUR/USD until ECB/Fed divergence narrows.' },
  },
  USDINR: {
    price: 83.42, change: 0.08, changePct: 0.10,
    marketInfo: { name: 'USD / Indian Rupee', exchange: 'Forex', currency: 'INR', currencySymbol: '₹', market: 'FOREX', volume: '$20B/day', marketCap: 'N/A', high: 83.55, low: 83.35 },
    newsImpact: { headline: 'RBI intervention caps USD/INR below 83.60 amid FII outflows', newsImpact: 'RBI selling USD reserves to prevent rupee weakness beyond 83.60. FII outflows of Rs 8,400Cr this month are primary pressure driver.', sentimentScore: 50, sentimentLabel: 'NEUTRAL' },
    technicalRead: { trend: 'RANGING', support1: 83.20, resistance1: 83.60, rsi: 52, technicalSummary: 'USD/INR in a tight 83.20-83.60 band. RBI suppresses volatility. Breakout above 83.60 could accelerate to 84.00.', technicalBias: 'NEUTRAL' },
    retailTrapAnalysis: { trapActive: false },
    synthesis: { recommendation: 'PROCEED_WITH_CAUTION', summary: 'Range-bound market. Trade the range edges or wait for directional breakout.' },
  },
  XAUUSD: {
    price: 2312.40, change: 18.60, changePct: 0.81,
    marketInfo: { name: 'Gold (XAU/USD)', exchange: 'Commodities', currency: 'USD', currencySymbol: '$', market: 'COMMODITY', volume: '$125B/day', marketCap: '$14.6T', high: 2328, low: 2295 },
    newsImpact: { headline: 'Gold hits record as central banks accelerate reserve diversification from USD', newsImpact: 'Central bank gold purchases hit record 1,037 tonnes in 2023. China, India, Poland leading. Geopolitical uncertainty and de-dollarization create structural bid.', sentimentScore: 78, sentimentLabel: 'BULLISH' },
    technicalRead: { trend: 'STRONG UPTREND', support1: 2250, resistance1: 2400, rsi: 71, technicalSummary: 'Gold in a clean multi-month uptrend. Every pullback is bought. RSI at 71 — extended but geopolitical premium sustains it. $2,250 is key support.', technicalBias: 'BULLISH' },
    retailTrapAnalysis: { trapActive: false },
    synthesis: { recommendation: 'FAVORABLE', summary: 'Structural bull market driven by central bank demand and de-dollarization. Long-term hold thesis intact.' },
  },
}

function MiniChart({ positive }: { positive: boolean }) {
  const pts = positive
    ? [40, 35, 42, 38, 45, 43, 50, 48, 55, 52, 60]
    : [60, 55, 52, 58, 48, 45, 42, 46, 38, 35, 30]
  const max = Math.max(...pts), min = Math.min(...pts)
  const norm = pts.map(p => 44 - ((p - min) / (max - min)) * 40)
  const path = norm.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * 10} ${y}`).join(' ')
  return (
    <svg width="100" height="44"><path d={path} fill="none" stroke={positive ? 'var(--bull)' : 'var(--bear)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  )
}

function AnalysisPanel({ symbol, data }: { symbol: string, data: any }) {
  const { marketInfo } = data
  const cs = marketInfo.currencySymbol
  const isUp = data.changePct >= 0
  const rec = data.synthesis?.recommendation

  return (
    <div className="slide-in" style={{ marginTop: '20px' }}>
      {/* Price card */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{marketInfo.name}</span>
          <span style={{ fontSize: '10px', padding: '2px 7px', background: 'var(--bg-subtle)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontWeight: '700' }}>{marketInfo.exchange}</span>
          <span style={{ fontSize: '10px', padding: '2px 7px', background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>{marketInfo.currency}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '28px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
                {cs}{data.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace', color: isUp ? 'var(--bull)' : 'var(--bear)' }}>
                {isUp ? '+' : ''}{cs}{Math.abs(data.change ?? 0).toFixed(2)} ({isUp ? '+' : ''}{(data.changePct ?? 0).toFixed(2)}%)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              {[['H', `${cs}${marketInfo.high?.toFixed(2)}`], ['L', `${cs}${marketInfo.low?.toFixed(2)}`], ['VOL', marketInfo.volume], ['CAP', marketInfo.marketCap]].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{k}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <MiniChart positive={isUp} />
            <div className={`badge ${rec === 'STRONG_AVOID' ? 'badge-bear' : rec === 'FAVORABLE' ? 'badge-bull' : 'badge-warning'}`}>
              {rec?.replace('_', ' ') ?? 'ANALYZING'}
            </div>
          </div>
        </div>
      </div>

      {/* 2-col analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <BarChart2 size={11} /> News Impact
          </div>
          <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: '1.5' }}>{data.newsImpact?.headline}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{data.newsImpact?.newsImpact}</p>
        </div>
        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Activity size={11} /> Technical Read
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            {[['Trend', data.technicalRead?.trend], ['RSI', data.technicalRead?.rsi], ['Support', `${cs}${data.technicalRead?.support1?.toLocaleString()}`], ['Resistance', `${cs}${data.technicalRead?.resistance1?.toLocaleString()}`]].map(([k, v]) => (
              <div key={k as string} style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '8px' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>{k}</div>
                <div style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{v}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{data.technicalRead?.technicalSummary}</p>
        </div>
      </div>

      {/* Retail trap */}
      {data.retailTrapAnalysis?.trapActive ? (
        <div style={{ background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--bear)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}><AlertTriangle size={11} /> Active Retail Trap</div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: '1.6' }}><strong style={{ color: 'var(--text-primary)' }}>Mistake:</strong> {data.retailTrapAnalysis.retailMistake}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}><strong style={{ color: 'var(--text-primary)' }}>Smart money:</strong> {data.retailTrapAnalysis.institutionalView}</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bull-dim)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={14} color="var(--bull)" />
          <span style={{ fontSize: '12px', color: 'var(--bull)', fontWeight: '600' }}>No active retail traps identified for {symbol}.</span>
        </div>
      )}

      {/* Synthesis */}
      <div className="glass-card" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>AI Synthesis:</span>
        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{data.synthesis?.summary ?? data.synthesis?.recommendationReason}</span>
      </div>
    </div>
  )
}

export default function ResearchPage() {
  const [ticker, setTicker] = useState('')
  const [symbol, setSymbol] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'mock' | 'live' | null>(null)

  const handleSearch = async (sym: string) => {
    const s = sym.toUpperCase().trim()
    if (!s) return
    setSymbol(s)
    setError(null)
    setLoading(true)
    setData(null)
    setSource(null)

    // Step 1: If we have instant mock data, show it while the API loads
    const mockResult = MOCK_ANALYSES[s]
    if (mockResult) {
      setTimeout(() => {
        setData(mockResult)
        setSource('mock')
        setLoading(false)
      }, 600)
      return
    }

    // Step 2: For any other ticker, call the real API
    try {
      const res = await fetch(`/api/research/${encodeURIComponent(s)}`)
      const json = await res.json()
      if (json.success && json.data) {
        // Normalise the API response into the same shape the UI expects
        const d = json.data
        const mi = d.marketInfo || {}
        setData({
          price: d.priceAtAnalysis ?? 0,
          change: mi.change ?? 0,
          changePct: mi.changePct ?? 0,
          marketInfo: {
            name: mi.name || s,
            exchange: mi.exchange || 'Global',
            currency: mi.currency || 'USD',
            currencySymbol: mi.currencySymbol || '$',
            market: mi.market || 'US',
            volume: mi.volume || 'N/A',
            marketCap: mi.marketCap || 'N/A',
            high: mi.high ?? d.priceAtAnalysis,
            low: mi.low ?? d.priceAtAnalysis,
          },
          newsImpact: d.newsImpact,
          technicalRead: d.technicalRead,
          retailTrapAnalysis: d.retailTrapAnalysis,
          synthesis: d.synthesis,
        })
        setSource('live')
      } else {
        setError(`Could not load analysis for ${s}. Check your API keys or try a different ticker.`)
      }
    } catch (err) {
      setError(`Network error. Make sure the dev server is running.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '920px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Research Terminal</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Multi-agent analysis · US stocks · Indian NSE/BSE · Crypto · Any global market</p>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '36px', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}
            placeholder="TICKER — e.g. AAPL, RELIANCE, TCS"
            value={ticker}
            onChange={e => setTicker(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(ticker) }}
          />
        </div>
        <button className="btn-primary" onClick={() => handleSearch(ticker)}>Analyze</button>
      </div>

      {/* Quick tickers — all markets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
        {MARKET_GROUPS.map(group => (
          <div key={group.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '100px', flexShrink: 0 }}>
              <span style={{ fontSize: '13px' }}>{group.flag}</span>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{group.label}</span>
            </div>
            {group.tickers.map((t: string) => (
              <button key={t}
                onClick={() => { setTicker(t); handleSearch(t) }}
                style={{
                  padding: '3px 10px', borderRadius: '5px', cursor: 'pointer',
                  border: `1px solid ${group.color}30`,
                  background: `${group.color}08`,
                  color: group.color,
                  fontSize: '11px', fontWeight: '600',
                  fontFamily: 'JetBrains Mono, monospace',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = `${group.color}18` }}
                onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = `${group.color}08` }}
              >
                {t}
              </button>
            ))}
          </div>
        ))}
      </div>

      {loading && (
        <div className="slide-in" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <div style={{ color: 'var(--accent-blue)', fontWeight: '600', marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace' }}>⟳ Analyzing {symbol}...</div>
          <div style={{ fontSize: '11px' }}>Fetching live price · Running news research · Technical analysis · Retail trap check</div>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '16px 20px', background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', textAlign: 'center' }}>
          <p style={{ color: 'var(--bear)', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Analysis failed for <span style={{ fontFamily: 'JetBrains Mono' }}>{symbol}</span></p>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{error}</p>
        </div>
      )}

      {data && !loading && (
        <>
          {source === 'live' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '6px', background: 'var(--bull-dim)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: '12px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--bull)', display: 'block' }} />
              <span style={{ fontSize: '11px', color: 'var(--bull)', fontWeight: '600' }}>Live API Analysis</span>
            </div>
          )}
          {source === 'mock' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '6px', background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Preview Data · Add API keys for live analysis</span>
            </div>
          )}
          <AnalysisPanel symbol={symbol} data={data} />
        </>
      )}

      {!symbol && !loading && (
        <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed var(--border-muted)', borderRadius: '12px' }}>
          <Search size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Enter any ticker for multi-agent analysis</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>Supports US, Indian NSE/BSE, Crypto, and global markets</p>
        </div>
      )}
    </div>
  )
}

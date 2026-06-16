"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Brain, Shield, TrendingUp, AlertTriangle, Zap, Globe, ArrowRight, Radio, BookOpen, Search, Check, X } from 'lucide-react'

interface ImpactStats {
  journals:     number
  positions:    number
  trapWarnings: number
  riskEntries:  number
  sessions:     number
}

const FEATURES = [
  {
    icon: Radio,
    color: '#3b82f6',
    title: 'Live Trading Copilot',
    desc: '6 specialized AI agents fire the moment you open a position — Technical, Institutional Flow, Dark Pool, Social Sentiment, Fundamental, and Behavioral. One consensus verdict in under 8 seconds.',
  },
  {
    icon: Brain,
    color: '#8b5cf6',
    title: 'Behavioral AI Monitor',
    desc: 'The only trading platform that detects when you\'re about to make your worst trade. When behavioral score reaches TILT, a full-screen emergency intervention blocks the mistake before it happens.',
  },
  {
    icon: AlertTriangle,
    color: '#ef4444',
    title: 'Retail Trap Detection',
    desc: 'Every news event, every price move — analyzed for institutional manipulation and retail trap patterns. See exactly what smart money is doing while retail floods in.',
  },
  {
    icon: BookOpen,
    color: '#22c55e',
    title: 'Behavioral Journal',
    desc: 'Write how you felt before and after a trade. Azure GPT-4o identifies FOMO, Revenge Trading, Panic, Greed — and builds your PsychProfile over time so you can see your own patterns.',
  },
  {
    icon: Search,
    color: '#f59e0b',
    title: 'Research Terminal',
    desc: 'Any ticker — US stocks, India NSE/BSE, Crypto, Forex, Commodities — parallel analysis in seconds. Technical read, news impact, retail trap check, and Azure GPT-4o synthesis.',
  },
  {
    icon: Shield,
    color: '#0078D4',
    title: 'Responsible AI by Azure',
    desc: 'Every journal entry screened by Azure Content Safety. Every analysis transparent and explainable. Built on Microsoft Azure OpenAI — the most trusted AI infrastructure in the world.',
  },
]

const MARKETS = ['🇺🇸 US Stocks', '🇮🇳 India NSE/BSE', '₿ Crypto', '💱 Forex', '🪙 Commodities', '🌏 Global ETFs']

const FAQ_ITEMS = [
  { q: 'Does TradeGuard AI give trading tips or signals?', a: 'No. TradeGuard AI provides educational analysis — it helps you understand what might be happening and flag behavioral risks. It never tells you to buy or sell, and it never places trades on your behalf.' },
  { q: 'Can I trust the AI analysis?', a: 'Every AI response is labeled with the model that actually produced it. Every statistic shows its sample size (e.g. "58% (n=31)"). We never fabricate numbers. When data is insufficient, we say so.' },
  { q: 'Does it work for Indian markets (NSE/BSE)?', a: 'Yes. Just type any NSE ticker (RELIANCE, TCS, HDFCBANK) — the app resolves it to the correct .NS Yahoo Finance symbol automatically. Prices show in ₹ with Indian digit grouping.' },
  { q: 'What happens when I reach my FREE plan limit?', a: 'You see an upgrade prompt with the exact limit and current usage. No silent degradation, no hidden paywalls mid-analysis.' },
  { q: 'Is my journal data private?', a: 'Journal text is processed by AI for behavioral analysis, then stored in your private account. It is never used for advertising or shared with third parties. Each entry is screened by Azure Content Safety.' },
]

export default function LandingPage() {
  const [stats,    setStats]    = useState<ImpactStats | null>(null)
  const [openFAQ,  setOpenFAQ]  = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/impact')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data) })
  }, [])

  // Signed-in users go directly to /feed
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.success && d.userId) router.replace('/feed') })
      .catch(() => null)
  }, [router])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,11,18,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '60px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={16} color="white" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>TradeGuard AI</span>
          <span style={{
            fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px',
            background: 'rgba(0,120,212,0.12)', color: '#0078D4',
            border: '1px solid rgba(0,120,212,0.25)', fontFamily: 'JetBrains Mono, monospace',
          }}>
            Azure GPT-4o
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Microsoft AI Agents Hackathon 2025</span>
          <Link href="/feed" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: '8px',
              background: 'var(--accent-blue)', color: 'white', border: 'none',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}>
              Open Platform <ArrowRight size={13} />
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: '100px 48px 80px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>

        {/* Problem badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 16px', borderRadius: '20px', marginBottom: '28px',
          background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.25)',
        }}>
          <AlertTriangle size={13} color="var(--bear)" />
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--bear)', letterSpacing: '0.04em' }}>
            9 in 10 retail traders lose money — SEBI, 2024
          </span>
        </div>

        {/* Main headline */}
        <h1 style={{
          fontSize: '58px', fontWeight: '900', lineHeight: '1.1',
          marginBottom: '24px', letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #e8edf5 0%, #7a8fa6 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          9 out of 10 traders<br />lose money.<br />We built the AI that tells<br />you why you&apos;ll be the 10th.
        </h1>

        <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto 12px' }}>
          SEBI&apos;s own data: 89% of F&O retail traders lost money in FY2023-24.
          The biggest predictor of loss isn&apos;t bad analysis — it&apos;s behavioral bias you can&apos;t see in yourself.
        </p>
        <p style={{ fontSize: '20px', color: 'var(--accent-blue)', lineHeight: '1.7', maxWidth: '680px', margin: '0 auto 48px', fontWeight: '700' }}>
          TradeGuard AI puts 6 specialized AI agents next to every retail trader — on every trade, in real time.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '64px' }}>
          <Link href="/feed" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 32px', borderRadius: '10px',
              background: 'var(--accent-blue)', color: 'white', border: 'none',
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(59,130,246,0.35)',
              transition: 'all 0.2s ease',
            }}>
              Open TradeGuard AI <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/copilot" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 32px', borderRadius: '10px',
              background: 'transparent', color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            }}>
              <Radio size={15} /> See Live Copilot
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px',
          background: 'var(--border-muted)', borderRadius: '16px', overflow: 'hidden',
          border: '1px solid var(--border-muted)',
        }}>
          {[
            { value: '200M+',   label: 'Retail traders worldwide',          sub: 'addressable market'           },
            { value: '90%',     label: 'Lose money in year one',            sub: 'without behavioral support'   },
            { value: '₹74Cr',   label: 'Active Indian NSE/BSE traders',     sub: 'underserved by AI tools'      },
            { value: '$500B',   label: 'Lost annually to emotional trading', sub: 'preventable with AI guidance' },
          ].map(s => (
            <div key={s.value} style={{ background: 'var(--bg-surface)', padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '3px' }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Impact Counter ── */}
      <section style={{ padding: '60px 48px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-muted)', borderBottom: '1px solid var(--border-muted)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', justifyContent: 'center' }}>
            <div className="pulse-dot" />
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--bull)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Live Platform Impact
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {[
              { value: stats?.journals     ?? '—', label: 'Journal Entries Analyzed',   color: 'var(--purple)',      icon: BookOpen    },
              { value: stats?.sessions     ?? '—', label: 'Copilot Sessions Run',        color: 'var(--accent-blue)', icon: Radio       },
              { value: stats?.trapWarnings ?? '—', label: 'Retail Trap Warnings',        color: 'var(--warning)',     icon: AlertTriangle },
              { value: stats?.riskEntries  ?? '—', label: 'High-Risk States Detected',   color: 'var(--bear)',        icon: Brain       },
              { value: stats?.positions    ?? '—', label: 'Positions Monitored',         color: 'var(--bull)',        icon: TrendingUp  },
            ].map(({ value, label, color, icon: Icon }) => (
              <div key={label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                borderRadius: '12px', padding: '20px 16px', textAlign: 'center',
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>
                  {value}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent Swarm Visual ── */}
      <section style={{ padding: '80px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>
            The Agent Swarm
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '14px' }}>
            6 AI agents. Running in parallel. On every trade.
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            Each agent owns one intelligence domain. They run simultaneously via Promise.all, then a 7th Azure GPT-4o consensus agent synthesizes them into one unified verdict.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[
            { name: 'Technical',     model: 'Azure GPT-4o',          color: '#3b82f6', desc: 'Price action, RSI, VWAP, EMA, support/resistance, volume profile'         },
            { name: 'Institutional', model: 'Claude 3.5 Sonnet',     color: '#8b5cf6', desc: 'Smart money flow, options positioning, dark pool signals, gamma exposure'  },
            { name: 'Dark Pool',     model: 'Claude 3.5 Sonnet',     color: '#06b6d4', desc: 'Volume anomalies, institutional accumulation vs distribution detection'     },
            { name: 'Social',        model: 'Grok Beta (xAI)',        color: '#f7931a', desc: 'X/Twitter sentiment, FOMO detection, pump/panic identification, hype score' },
            { name: 'Fundamental',   model: 'Perplexity + Claude',    color: '#f59e0b', desc: 'Breaking news, analyst moves, earnings catalysts, sector events'            },
            { name: 'Behavioral',    model: 'Claude 3.5 Sonnet',     color: '#22c55e', desc: 'Your personal psychology — detects TILT, FOMO, Revenge patterns in real time'},
          ].map(a => (
            <div key={a.name} style={{ background: 'var(--bg-card)', border: `1px solid ${a.color}25`, borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: '800', color: a.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.name}</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }}>{a.model}</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{a.desc}</p>
            </div>
          ))}
        </div>

        {/* Consensus box */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid rgba(0,120,212,0.35)',
          borderRadius: '12px', padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: '0 0 30px rgba(0,120,212,0.08)',
        }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(0,120,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={20} color="#0078D4" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>Consensus Agent</span>
              <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', background: 'rgba(0,120,212,0.12)', color: '#0078D4', border: '1px solid rgba(0,120,212,0.25)', fontFamily: 'JetBrains Mono, monospace' }}>
                Azure OpenAI GPT-4o
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              After all 6 agents complete, a 7th Azure GPT-4o instance reads every perspective and produces the unified verdict: HOLD_POSITION · FAVORABLE_CONDITIONS · ADD_CAUTION · REVIEW_STOP · EXIT_NOW
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '60px 48px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-muted)', borderBottom: '1px solid var(--border-muted)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>Everything a retail trader needs</h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Built for the 200 million traders that institutions ignore.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: f.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <Icon size={18} color={f.color} />
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>{f.title}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.65' }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Global Markets ── */}
      <section style={{ padding: '60px 48px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>
          Global Markets
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>
          Not just US stocks. Every market that matters.
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>
          Supporting 74 million Indian NSE/BSE traders that most AI tools ignore. Plus US, Crypto, Forex, and Commodities.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
          {MARKETS.map(m => (
            <span key={m} style={{
              padding: '8px 18px', borderRadius: '20px',
              background: 'var(--bg-card)', border: '1px solid var(--border-default)',
              fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)',
            }}>
              {m}
            </span>
          ))}
        </div>
      </section>

      {/* ── Azure Stack ── */}
      <section style={{ padding: '60px 48px', background: 'linear-gradient(135deg, rgba(0,120,212,0.08) 0%, rgba(139,92,246,0.08) 100%)', borderTop: '1px solid var(--border-muted)', borderBottom: '1px solid var(--border-muted)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
            <Shield size={16} color="#0078D4" />
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#0078D4', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Built on Microsoft Azure
            </span>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '14px' }}>Responsible AI — not just smart AI</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '32px' }}>
            Every journal entry screened by Azure Content Safety before it touches the database. Every AI response transparent and explainable. TradeGuard AI is built on Microsoft&apos;s Responsible AI principles — safe, reliable, and accountable.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { service: 'Azure OpenAI GPT-4o',      role: 'All 6 copilot agents + research synthesis + journal coaching',   color: '#0078D4' },
              { service: 'Azure Content Safety',      role: 'Screens every journal entry for harmful content before DB write', color: '#0078D4' },
              { service: 'GitHub Models (Fallback)',   role: 'Free-tier fallback ensuring platform availability 24/7',          color: '#8b5cf6' },
            ].map(s => (
              <div key={s.service} style={{ background: 'var(--bg-card)', border: `1px solid rgba(0,120,212,0.2)`, borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: s.color, marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace' }}>{s.service}</div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{s.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          The room just got less lonely.
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
          200 million retail traders. 74 million in India. All of them deserve the same intelligence institutions take for granted.
        </p>
        <Link href="/feed" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '16px 40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: 'white', border: 'none',
            fontSize: '16px', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
          }}>
            Start Free — No Credit Card <ArrowRight size={18} />
          </button>
        </Link>
      </section>

      {/* ── Pricing ── */}
      <section style={{ padding: '80px 48px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-muted)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>Pricing</div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '10px' }}>Simple. Transparent. No tricks.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* FREE */}
            <div style={{ padding: '28px', borderRadius: '16px', border: '1px solid var(--border-default)', background: 'var(--bg-card)' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>FREE</div>
              <div style={{ fontSize: '36px', fontWeight: '900', fontFamily: 'JetBrains Mono, monospace', marginBottom: '20px' }}>₹0<span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text-muted)', marginLeft: '6px' }}>/month</span></div>
              {['5 watchlist symbols', '5 AI research queries/day', 'Journal — unlimited', 'Streak + PsychProfile', 'No Copilot · No Mind Engine'].map((f, i) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', color: i === 4 ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                  {i === 4 ? <X size={13} color="var(--text-muted)" /> : <Check size={13} color="var(--bull)" />} {f}
                </div>
              ))}
              <Link href="/feed" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Start Free
                </button>
              </Link>
            </div>
            {/* PRO */}
            <div style={{ padding: '28px', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '8px' }}>
                <Zap size={13} /> PRO
              </div>
              <div style={{ fontSize: '36px', fontWeight: '900', fontFamily: 'JetBrains Mono, monospace', marginBottom: '20px' }}>₹499<span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text-muted)', marginLeft: '6px' }}>/month</span></div>
              {['Unlimited watchlist + research', 'Live Copilot — 6 agents + consensus', 'Mind Engine V7 — daily directive', 'Trader Model — personal statistics', 'Regime Detection (HMM-powered)'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Check size={13} color="var(--bull)" /> {f}
                </div>
              ))}
              <Link href="/settings" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--accent-blue)', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Zap size={14} /> Upgrade — ₹499/month
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 48px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '32px', textAlign: 'center' }}>Frequently Asked Questions</h2>
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              style={{ borderBottom: '1px solid var(--border-muted)', marginBottom: '0' }}
            >
              <button
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', textAlign: 'left' }}
              >
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.q}</span>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: '18px', lineHeight: 1 }}>{openFAQ === i ? '−' : '+'}</span>
              </button>
              {openFAQ === i && (
                <div style={{ paddingBottom: '18px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer + Disclaimer ── */}
      <footer style={{ padding: '40px 48px', borderTop: '1px solid var(--border-muted)', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '20px', padding: '16px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
            <strong>Important Disclaimer:</strong> TradeGuard AI provides educational analysis only and does not constitute investment advice. The AI analysis is not a substitute for professional financial advice. Past behavioral patterns do not guarantee future results. TradeGuard AI does not execute trades or hold client funds. All users should consult a SEBI-registered investment advisor before making investment decisions. The 90% statistic references SEBI&apos;s FY2023-24 study on retail F&O trader profitability.
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            © 2025 TradeGuard AI · tradeguard.app · Not a SEBI-registered entity · Educational use only
          </div>
        </div>
      </footer>
    </div>
  )
}
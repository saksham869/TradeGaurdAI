"use client"

import { useState } from 'react'
import { BookOpen, Send, Brain, TrendingUp, Calendar, Tag } from 'lucide-react'

const MOCK_ENTRIES = [
  {
    id: '1',
    createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    symbol: 'TSLA',
    rawText: "Got frustrated and bought TSLA on the dip even though I said I wouldn't. It kept going down. Sold at a loss. FOMO got the better of me again.",
    aiResponse: {
      whatYourThinkingShows: 'This is classic FOMO buying driven by loss aversion bias. You\'re trying to "make back" a feeling, not a trade setup.',
      patternMatch: 'Revenge Trading → FOMO Dip Buy',
      oneThing: 'Before any trade, write the setup in one sentence. If you can\'t, don\'t trade it.',
    },
  },
  {
    id: '2',
    createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    symbol: 'NVDA',
    rawText: "Held through earnings even though my plan was to cut before. Greed got me. Up 8% but it felt like luck not skill.",
    aiResponse: {
      whatYourThinkingShows: 'You\'re confusing outcome with process quality. A good outcome from a broken plan is still a broken plan — this will hurt you long-term.',
      patternMatch: 'Plan Deviation → Outcome Bias',
      oneThing: 'Add "did I follow my plan?" as the first question in your post-trade review, before checking the P&L.',
    },
  },
  {
    id: '3',
    createdAt: new Date(Date.now() - 8 * 24 * 3600000).toISOString(),
    symbol: undefined,
    rawText: "Great session today. Waited patiently for my setup on SPY, entered exactly at my level, hit profit target and walked away. Felt calm the whole time.",
    aiResponse: {
      whatYourThinkingShows: 'This is the mindset of a professional trader. Process over outcome. Patience as a skill, not a personality trait.',
      patternMatch: 'Disciplined Execution → Process Focus',
      oneThing: 'Replicate this exact pre-trade state next session. Note what you did before opening the platform.',
    },
  },
]

function JournalEntryCard({ entry }: { entry: typeof MOCK_ENTRIES[0] }) {
  const [showAI, setShowAI] = useState(false)
  const date = new Date(entry.createdAt)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const ai = entry.aiResponse

  const patternColor = ai.patternMatch?.includes('Revenge') || ai.patternMatch?.includes('FOMO') || ai.patternMatch?.includes('Deviation')
    ? 'var(--bear)' : 'var(--bull)'

  return (
    <div className="glass-card" style={{ padding: '16px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
            <Calendar size={10} /> {dateStr}
          </div>
          {entry.symbol && (
            <span className="tag">{entry.symbol}</span>
          )}
        </div>
        <button
          onClick={() => setShowAI(!showAI)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '6px',
            background: showAI ? 'rgba(139,92,246,0.1)' : 'var(--bg-subtle)',
            border: `1px solid ${showAI ? 'rgba(139,92,246,0.3)' : 'var(--border-muted)'}`,
            color: showAI ? 'var(--purple)' : 'var(--text-muted)',
            fontSize: '11px', fontWeight: '600', cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Brain size={11} /> {showAI ? 'Hide AI' : 'AI Analysis'}
        </button>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.7', marginBottom: showAI ? '14px' : '0' }}>
        {entry.rawText}
      </p>
      {showAI && (
        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="slide-in">
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--purple)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Coach Insight</div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{ai.whatYourThinkingShows}</p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pattern</div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: patternColor, fontFamily: 'JetBrains Mono, monospace' }}>{ai.patternMatch}</span>
            </div>
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Action for tomorrow</div>
              <span style={{ fontSize: '12px', color: 'var(--bull)', fontWeight: '600' }}>{ai.oneThing}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function JournalPage() {
  const [text, setText] = useState('')
  const [symbol, setSymbol] = useState('')
  const [entries, setEntries] = useState(MOCK_ENTRIES)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setTimeout(() => {
      const newEntry = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        symbol: symbol.toUpperCase().trim() || undefined,
        rawText: text,
        aiResponse: {
          whatYourThinkingShows: 'Your entry has been logged. Keep journaling daily — patterns become clear over weeks, not days.',
          patternMatch: 'Self-Awareness Practice',
          oneThing: 'Review yesterday\'s entry before making any trade today.',
        },
      }
      setEntries([newEntry as any, ...entries])
      setText('')
      setSymbol('')
      setSubmitting(false)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }, 800)
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Trading Journal</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Log your thoughts · AI detects behavioral patterns · Build trading discipline</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Form */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>New Entry</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <Tag size={10} /> Ticker (Optional)
              </label>
              <input
                className="input-field"
                style={{ fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}
                placeholder="e.g. TSLA"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <BookOpen size={10} /> Your Notes
              </label>
              <textarea
                className="input-field"
                style={{ resize: 'vertical', minHeight: '140px', lineHeight: '1.6' }}
                placeholder="What did you observe today? Any trades you regret or are proud of? What were you feeling?"
                value={text}
                onChange={e => setText(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !text.trim()}
              style={{ width: '100%', justifyContent: 'center', opacity: !text.trim() ? 0.5 : 1 }}
            >
              {submitting ? '⟳ Analyzing...' : <><Brain size={14} /> Reflect with AI Coach</>}
            </button>
            {submitted && (
              <div style={{ padding: '10px', background: 'var(--bull-dim)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', color: 'var(--bull)', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>
                ✓ Entry logged and analyzed
              </div>
            )}
          </form>

          {/* Stats */}
          <div style={{ marginTop: '20px', padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Your Stats</div>
            {[
              ['Total Entries', entries.length.toString()],
              ['Patterns Found', '2'],
              ['Streak', '3 days'],
              ['Top Pattern', 'FOMO'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            History  <span style={{ color: 'var(--accent-blue)', marginLeft: '4px' }}>{entries.length}</span>
          </div>
          {entries.map(entry => <JournalEntryCard key={entry.id} entry={entry} />)}
        </div>
      </div>
    </div>
  )
}

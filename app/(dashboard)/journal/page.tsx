"use client"

import { useState, useEffect } from 'react'
import { BookOpen, Brain, Calendar, Tag, AlertTriangle, RefreshCw, Flame } from 'lucide-react'
import AITransparencyBadge from '@/components/ui/AITransparencyBadge'

// ─── types ────────────────────────────────────────────────────────────────────

interface AIResponse {
  whatYourThinkingShows?: string
  patternMatch?:          string
  oneThing?:              string
  encouragement?:         string
  emotionTag?:            string
  riskLevel?:             string
  riskNote?:              string | null
}

interface JournalEntry {
  id:               string
  createdAt:        string
  symbol?:          string | null
  rawText:          string
  aiResponse?:      AIResponse | null
  emotionTag:       string
  riskFlag:         boolean
  processingStatus: string
}

// ─── constants ────────────────────────────────────────────────────────────────

const TAG_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  DISCIPLINED:   { color: 'var(--bull)',        bg: 'var(--bull-dim)',        border: 'rgba(34,197,94,0.25)'   },
  FOMO:          { color: 'var(--warning)',      bg: 'var(--warning-dim)',     border: 'rgba(245,158,11,0.25)'  },
  REVENGE:       { color: 'var(--bear)',         bg: 'var(--bear-dim)',        border: 'rgba(239,68,68,0.25)'   },
  PANIC:         { color: 'var(--bear)',         bg: 'var(--bear-dim)',        border: 'rgba(239,68,68,0.25)'   },
  GREED:         { color: '#f7931a',             bg: 'rgba(247,147,26,0.1)',   border: 'rgba(247,147,26,0.25)'  },
  FEARFUL:       { color: 'var(--warning)',      bg: 'var(--warning-dim)',     border: 'rgba(245,158,11,0.25)'  },
  OVERCONFIDENT: { color: 'var(--purple)',       bg: 'var(--purple-dim)',      border: 'rgba(139,92,246,0.25)'  },
  NEUTRAL:       { color: 'var(--accent-blue)',  bg: 'var(--accent-blue-dim)', border: 'rgba(59,130,246,0.2)'   },
  UNCLEAR:       { color: 'var(--text-muted)',   bg: 'var(--bg-subtle)',       border: 'var(--border-muted)'    },
}

function tagStyle(tag: string) {
  return TAG_STYLES[tag] ?? TAG_STYLES['NEUTRAL']
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── PsychProfile computed from entries ──────────────────────────────────────

function computeProfile(entries: JournalEntry[]) {
  const tagCount: Record<string, number> = {}
  let riskEntries = 0
  entries.forEach(e => {
    const t = e.emotionTag || 'NEUTRAL'
    tagCount[t] = (tagCount[t] || 0) + 1
    if (e.riskFlag) riskEntries++
  })
  const dominant = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'NEUTRAL'

  // Calculate consecutive journaling streak
  const days = new Set(entries.map(e => new Date(e.createdAt).toDateString()))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (days.has(d.toDateString())) streak++
    else if (i > 0) break
  }

  return { tagCount, dominant, riskEntries, total: entries.length, streak }
}

// ─── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({ entry }: { entry: JournalEntry }) {
  const [showAI, setShowAI] = useState(false)
  const ai = entry.aiResponse as AIResponse | null
  const ts = tagStyle(entry.emotionTag)

  return (
    <div className="glass-card" style={{ padding: '16px', marginBottom: '10px', animation: 'slideIn 0.3s ease' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={10} /> {formatDate(entry.createdAt)}
          </span>
          {entry.symbol && <span className="tag">{entry.symbol}</span>}
          {entry.riskFlag && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: '700', color: 'var(--bear)', background: 'var(--bear-dim)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={9} /> Flagged
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '5px',
            color: ts.color, background: ts.bg, border: `1px solid ${ts.border}`,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {entry.emotionTag}
          </span>
          {ai && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button onClick={() => setShowAI(!showAI)} style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                background: showAI ? 'rgba(139,92,246,0.1)' : 'var(--bg-subtle)',
                border: `1px solid ${showAI ? 'rgba(139,92,246,0.3)' : 'var(--border-muted)'}`,
                color: showAI ? 'var(--purple)' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}>
                <Brain size={11} /> {showAI ? 'Hide' : 'AI Coach'}
              </button>
              <AITransparencyBadge
                model="Azure OpenAI GPT-4o"
                task="Behavioral journal reflection — emotion tagging and pattern detection"
                inputSummary={`Journal text (${entry.rawText.length} chars)${entry.symbol ? ` · Ticker: ${entry.symbol}` : ''} · Recent emotion patterns used`}
                safetyPassed={!entry.riskFlag}
                generatedAt={entry.createdAt}
              />
            </div>
          )}
        </div>
      </div>

      {/* Journal text */}
      <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.7', marginBottom: showAI ? '12px' : 0 }}>
        {entry.rawText}
      </p>

      {/* AI response */}
      {showAI && ai && (
        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="slide-in">
          {ai.whatYourThinkingShows && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--purple)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Coach Insight</div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{ai.whatYourThinkingShows}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {ai.patternMatch && (
              <div style={{ flex: 1, minWidth: '140px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Pattern</div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: ts.color, fontFamily: 'JetBrains Mono, monospace' }}>{ai.patternMatch}</span>
              </div>
            )}
            {ai.oneThing && (
              <div style={{ flex: 2, minWidth: '180px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Action for tomorrow</div>
                <span style={{ fontSize: '12px', color: 'var(--bull)', fontWeight: '600', lineHeight: '1.5', display: 'block' }}>{ai.oneThing}</span>
              </div>
            )}
          </div>
          {ai.encouragement && (
            <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(139,92,246,0.12)', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {ai.encouragement}
            </div>
          )}
          {ai.riskNote && (
            <div style={{ background: 'var(--warning-dim)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: 'var(--warning)' }}>
              ⚠️ {ai.riskNote}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [entries,    setEntries]    = useState<JournalEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [text,       setText]       = useState('')
  const [symbol,     setSymbol]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Load real entries from DB on mount
  useEffect(() => {
    fetch('/api/journal')
      .then(r => r.json())
      .then(d => { if (d.success) setEntries(d.data) })
      .finally(() => setLoadingHistory(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res  = await fetch('/api/journal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rawText: text.trim(), symbol: symbol.trim() || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        setEntries(prev => [data.data, ...prev])
        setText('')
        setSymbol('')
      } else {
        setSubmitError(data.error || 'Failed to save entry.')
      }
    } catch {
      setSubmitError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const profile = computeProfile(entries)

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Trading Journal</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Log your thoughts · AI detects behavioral patterns · Build trading discipline</p>
        </div>
        {profile.streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '10px',
            background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)',
          }}>
            <Flame size={20} color="#fb923c" />
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: '#fb923c', lineHeight: 1 }}>{profile.streak}d</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Streak · Best: {profile.streak}d</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── Left: form + stats ── */}
        <div>
          {/* Entry form */}
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>New Entry</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                disabled={submitting}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <BookOpen size={10} /> Your Notes
              </label>
              <textarea
                className="input-field"
                style={{ resize: 'vertical', minHeight: '130px', lineHeight: '1.6' }}
                placeholder="What did you observe today? Any trades you regret or are proud of? What were you feeling?"
                value={text}
                onChange={e => setText(e.target.value)}
                disabled={submitting}
              />
            </div>

            {submitError && (
              <div style={{ background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: 'var(--bear)' }}>
                {submitError}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !text.trim()}
              style={{ width: '100%', justifyContent: 'center', opacity: !text.trim() ? 0.5 : 1 }}
            >
              {submitting
                ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing with AI...</>
                : <><Brain size={13} /> Reflect with AI Coach</>
              }
            </button>
          </form>

          {/* PsychProfile stats */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Brain size={12} /> PsychProfile
            </div>
            <div className="glass-card" style={{ padding: '14px' }}>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {[
                  { label: 'Entries',   value: profile.total.toString()       },
                  { label: 'Streak',    value: profile.streak > 0 ? `🔥 ${profile.streak}d` : '0d' },
                  { label: 'Risk Flags', value: profile.riskEntries.toString() },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-subtle)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{s.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Dominant tag */}
              {profile.total > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Dominant Pattern</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: '800', padding: '4px 12px', borderRadius: '6px',
                      color: tagStyle(profile.dominant).color,
                      background: tagStyle(profile.dominant).bg,
                      border: `1px solid ${tagStyle(profile.dominant).border}`,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {profile.dominant}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {profile.tagCount[profile.dominant]}× detected
                    </span>
                  </div>
                </div>
              )}

              {/* Tag frequency bars */}
              {profile.total > 0 && (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Emotion Breakdown</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {Object.entries(profile.tagCount)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([tag, count]) => {
                        const pct = Math.round((count / profile.total) * 100)
                        const ts  = tagStyle(tag)
                        return (
                          <div key={tag}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span style={{ fontSize: '10px', fontWeight: '700', color: ts.color, fontFamily: 'JetBrains Mono, monospace' }}>{tag}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{count}× · {pct}%</span>
                            </div>
                            <div style={{ height: '4px', borderRadius: '2px', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: ts.color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {profile.total === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  Submit your first entry to start building your PsychProfile.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: history ── */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            History
            {entries.length > 0 && (
              <span style={{ color: 'var(--accent-blue)', fontFamily: 'JetBrains Mono, monospace' }}>{entries.length}</span>
            )}
          </div>

          {loadingHistory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
              ))}
            </div>
          )}

          {!loadingHistory && entries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-muted)', borderRadius: '12px' }}>
              <BookOpen size={28} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No entries yet.</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Write your first journal entry to start your PsychProfile.</p>
            </div>
          )}

          {!loadingHistory && entries.map(entry => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  )
}
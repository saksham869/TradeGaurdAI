"use client"

import { useRef, useEffect, useState, useCallback } from 'react'
import { X, Send, Bot, Loader2 } from 'lucide-react'
import type { ChatMessage } from '@/lib/ai/stream'

// ─── Inline stock mini-card ───────────────────────────────────────────────────

function StockMiniCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<{ price: number; changePct: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/prices/${encodeURIComponent(symbol)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData({ price: d.data.price, changePct: d.data.changePct }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [symbol])

  const up = (data?.changePct ?? 0) >= 0

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '2px 8px', margin: '0 2px',
      background: 'var(--bg-subtle)',
      border: `1px solid ${loading ? 'var(--border-muted)' : 'var(--border-default)'}`,
      borderRadius: '4px',
      fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
      verticalAlign: 'middle',
      // One restrained shimmer while loading — the only scan-line style effect in the app
      animation: loading ? 'tg-mini-card-scan 1.4s linear infinite' : 'none',
    }}>
      <span style={{ color: 'var(--accent-blue)', fontWeight: '700' }}>{symbol}</span>
      {loading ? (
        <span style={{ color: 'var(--text-muted)' }}>···</span>
      ) : data ? (
        <>
          <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
            {data.price < 1000
              ? data.price.toFixed(2)
              : data.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span style={{ color: up ? 'var(--bull)' : 'var(--bear)', fontWeight: '600' }}>
            {up ? '+' : ''}{data.changePct.toFixed(2)}%
          </span>
        </>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
      )}
    </span>
  )
}

// Parse AI text and inject inline stock cards for $SYMBOL patterns
function MessageContent({ text }: { text: string }) {
  const parts = text.split(/(\$[A-Z][A-Z0-9.\-]{0,11})/g)
  return (
    <>
      {parts.map((part, i) =>
        /^\$[A-Z][A-Z0-9.\-]{0,11}$/.test(part)
          ? <StockMiniCard key={i} symbol={part.slice(1)} />
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

// ─── Message type ─────────────────────────────────────────────────────────────

interface Message {
  id:      string
  role:    'user' | 'assistant'
  content: string
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface AskTradeGuardProps {
  open:    boolean
  onClose: () => void
}

export default function AskTradeGuard({ open, onClose }: AskTradeGuardProps) {
  const [messages,  setMessages]  = useState<Message[]>([])
  const [input,     setInput]     = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const inputRef      = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef      = useRef<AbortController | null>(null)

  // Auto-scroll on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return

    setError(null)
    setInput('')

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    const assistantId = crypto.randomUUID()

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '' },
    ])
    setStreaming(true)

    const history: ChatMessage[] = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ]

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/assistant/message', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history }),
        signal:  abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(res.status === 401 ? 'Not signed in' : 'Request failed')
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        )
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Failed to reach assistant. Check your connection and try again.')
      // Remove the empty assistant placeholder on error
      setMessages(prev => prev.filter(m => m.id !== assistantId))
    } finally {
      setStreaming(false)
    }
  }, [input, streaming, messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage()
  }

  if (!open) return null

  const showWelcome = messages.length === 0

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.25)' }}
      />

      {/* Panel — no glassmorphism, no gradient background, terminal card only */}
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 401,
        width: '420px',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column',
        animation: 'tg-panel-slide-in 0.22s cubic-bezier(0.16,1,0.3,1) both',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-muted)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={14} color="var(--accent-blue)" />
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '12px',
              fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '0.04em',
            }}>
              ASK TRADEGUARD
            </span>
            <span style={{
              fontSize: '10px', fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text-muted)', padding: '1px 5px',
              background: 'var(--bg-subtle)', borderRadius: '3px',
              border: '1px solid var(--border-muted)',
            }}>
              claude-sonnet-4-6
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close assistant"
            style={{
              width: '26px', height: '26px', borderRadius: '6px',
              background: 'transparent', border: '1px solid var(--border-muted)',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.12s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          {showWelcome && (
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-muted)',
              borderRadius: '8px',
              fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.7',
            }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>What can I help with?</span>
              <br />
              Position sizing · risk management · behavioral analysis · market dynamics · reading indicators.
              <br /><br />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Not financial advice. Use your own judgment.
              </span>
              <br /><br />
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
                Tip: mention a symbol like $NIFTY or $AAPL — I&apos;ll show live prices inline.
              </span>
            </div>
          )}

          {messages.map(m => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                gap: '8px', alignItems: 'flex-start',
              }}
            >
              {m.role === 'assistant' && (
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={11} color="var(--accent-blue)" />
                </div>
              )}

              <div style={{
                maxWidth: '85%',
                padding: '10px 12px',
                borderRadius: m.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                background: m.role === 'user' ? 'var(--bg-elevated)' : 'var(--bg-card)',
                border: '1px solid var(--border-muted)',
                fontSize: '13px', lineHeight: '1.7',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {m.role === 'assistant' && m.content
                  ? <MessageContent text={m.content} />
                  : m.role === 'assistant' && streaming
                    ? <Loader2 size={13} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
                    : m.content
                }
              </div>
            </div>
          ))}

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: '8px', fontSize: '12px',
              background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--bear)',
            }}>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border-muted)',
            display: 'flex', gap: '8px', alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about positions, risk, market dynamics…"
            disabled={streaming}
            style={{
              flex: 1, padding: '9px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              color: 'var(--text-primary)', fontSize: '13px',
              outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            style={{
              width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
              background: streaming || !input.trim() ? 'var(--bg-subtle)' : 'var(--accent-blue)',
              border: 'none',
              cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.12s', color: 'white',
              opacity: streaming || !input.trim() ? 0.4 : 1,
            }}
            onMouseOver={e => {
              if (!streaming && input.trim()) e.currentTarget.style.filter = 'brightness(1.15)'
            }}
            onMouseOut={e => { e.currentTarget.style.filter = 'none' }}
          >
            <Send size={13} />
          </button>
        </form>
      </aside>
    </>
  )
}

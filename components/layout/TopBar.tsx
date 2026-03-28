"use client"

import { Bell, Clock } from 'lucide-react'

export default function TopBar() {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <header style={{
      height: '52px',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-muted)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>SPY</span>
          <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--bull)', fontWeight: '600' }}>+0.83%</span>
        </div>
        <div style={{ width: '1px', height: '16px', background: 'var(--border-muted)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>QQQ</span>
          <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--bull)', fontWeight: '600' }}>+1.12%</span>
        </div>
        <div style={{ width: '1px', height: '16px', background: 'var(--border-muted)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>BTC</span>
          <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--bear)', fontWeight: '600' }}>-0.41%</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
          <Clock size={12} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{timeStr} · {dateStr}</span>
        </div>
        <button style={{
          width: '32px', height: '32px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)',
          transition: 'all 0.15s ease',
        }}
          onMouseOver={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-active)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
          }}
        >
          <Bell size={14} />
        </button>
        <div style={{
          width: '32px', height: '32px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: '700', color: 'white',
          cursor: 'pointer',
        }}>
          T
        </div>
      </div>
    </header>
  )
}

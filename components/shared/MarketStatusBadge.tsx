"use client"

/**
 * Shows whether the relevant market is currently open or closed.
 * NSE hours: 09:15–15:30 IST (Mon–Fri)
 * NYSE/NASDAQ hours: 09:30–16:00 ET (Mon–Fri)
 */

interface Props {
  yahooSymbol: string
  className?: string
}

function getNSEStatus(): { open: boolean; label: string } {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = ist.getDay()
  const h = ist.getHours()
  const m = ist.getMinutes()
  const mins = h * 60 + m
  const open = day >= 1 && day <= 5 && mins >= 9 * 60 + 15 && mins < 15 * 60 + 30
  const label = open ? 'NSE Open' : 'NSE Closed'
  return { open, label }
}

function getNYSEStatus(): { open: boolean; label: string } {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay()
  const h = et.getHours()
  const m = et.getMinutes()
  const mins = h * 60 + m
  const open = day >= 1 && day <= 5 && mins >= 9 * 60 + 30 && mins < 16 * 60
  const label = open ? 'NYSE Open' : 'NYSE Closed'
  return { open, label }
}

export default function MarketStatusBadge({ yahooSymbol, className }: Props) {
  const isIndian = yahooSymbol.endsWith('.NS') || yahooSymbol.endsWith('.BO')
  const { open, label } = isIndian ? getNSEStatus() : getNYSEStatus()

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: '700',
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.04em',
        background: open ? 'rgba(34,197,94,0.1)' : 'var(--bg-subtle)',
        color: open ? 'var(--bull)' : 'var(--text-muted)',
        border: `1px solid ${open ? 'rgba(34,197,94,0.25)' : 'var(--border-muted)'}`,
      }}
    >
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: open ? 'var(--bull)' : 'var(--text-muted)',
        flexShrink: 0,
      }} />
      {label}
    </span>
  )
}
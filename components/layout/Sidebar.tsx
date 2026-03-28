"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Search, BookOpen, Star, Settings,
  TrendingUp, Zap
} from 'lucide-react'

const links = [
  { href: '/feed', label: 'Intelligence Feed', icon: LayoutDashboard },
  { href: '/research', label: 'Research', icon: Search },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/watchlist', label: 'Watchlist', icon: Star },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '220px',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-muted)',
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <TrendingUp size={16} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
              TradeGuard
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600', letterSpacing: '0.1em' }}>
              AI · V1
            </div>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-muted)' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--bull-dim)',
          border: '1px solid rgba(34,197,94,0.15)',
          borderRadius: '6px', padding: '5px 8px',
        }}>
          <div className="pulse-dot" />
          <span style={{ fontSize: '11px', color: 'var(--bull)', fontWeight: '600' }}>Markets Open</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ padding: '4px 8px 8px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
              <div className={`nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={16} />
                <span>{link.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom hint */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-muted)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px', borderRadius: '8px',
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.12)',
        }}>
          <Zap size={12} color="var(--accent-blue)" />
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent-blue)' }}>Prototype Mode</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Using mock data</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

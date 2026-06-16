"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, BookOpen, Radio, Brain, ClipboardList, MoreHorizontal } from 'lucide-react'

const TABS = [
  { href: '/feed',     label: 'Feed',     icon: LayoutDashboard },
  { href: '/mind',     label: 'Mind',     icon: Brain           },
  { href: '/trades',   label: 'Trades',   icon: ClipboardList   },
  { href: '/journal',  label: 'Journal',  icon: BookOpen        },
  { href: '/settings', label: 'More',     icon: MoreHorizontal  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              flex: 1, padding: '8px 4px',
              color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
              textDecoration: 'none',
            }}
          >
            <Icon size={20} />
            <span style={{ fontSize: '9px', fontWeight: active ? '700' : '500', letterSpacing: '0.04em' }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

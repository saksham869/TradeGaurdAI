"use client"

import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <div className="sidebar-desktop" style={{ display: 'flex' }}>
        <Sidebar />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <main
          className="main-content-mobile"
          style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

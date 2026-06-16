"use client"

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import OnboardingModal from '@/components/shared/OnboardingModal'

const ONBOARDING_KEY = 'tg_onboarded'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true)
    }
  }, [])

  function dismissOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShowOnboarding(false)
  }

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
      <OnboardingModal open={showOnboarding} onClose={dismissOnboarding} />
    </div>
  )
}

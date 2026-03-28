import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 28px',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}

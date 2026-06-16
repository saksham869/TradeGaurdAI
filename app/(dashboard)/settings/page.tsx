"use client"

import { useState } from 'react'
import { Settings, Key, Bell, Shield, Database, Palette, ChevronRight, Check, Eye, EyeOff, CreditCard, Zap } from 'lucide-react'
import UpgradeModal from '@/components/billing/UpgradeModal'

const SECTIONS = [
  { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data', label: 'Data & Privacy', icon: Shield },
]

function SectionButton({ id, label, icon: Icon, active, onClick }: any) {
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
        padding: '10px 12px', borderRadius: '8px', border: 'none', textAlign: 'left',
        background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
        color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
        fontSize: '13px', fontWeight: active ? '600' : '500', cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <Icon size={15} />
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronRight size={13} style={{ opacity: active ? 1 : 0.4 }} />
    </button>
  )
}

function ApiKeyField({ label, keyName, placeholder }: { label: string, keyName: string, placeholder: string }) {
  const [visible, setVisible] = useState(false)
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{label}</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            className="input-field"
            type={visible ? 'text' : 'password'}
            placeholder={placeholder}
            value={value}
            onChange={e => setValue(e.target.value)}
            style={{ paddingRight: '40px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
          />
          <button
            onClick={() => setVisible(!visible)}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            {visible ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <button
          className={saved ? '' : 'btn-ghost'}
          onClick={handleSave}
          style={saved ? {
            display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px',
            background: 'var(--bull-dim)', border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: '8px', color: 'var(--bull)', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          } : {}}
        >
          {saved ? <><Check size={13} /> Saved</> : 'Save'}
        </button>
      </div>
    </div>
  )
}

function Toggle({ label, description, defaultOn = false }: { label: string, description: string, defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-muted)' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <button
        onClick={() => setOn(!on)}
        style={{
          width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
          background: on ? 'var(--accent-blue)' : 'var(--bg-subtle)',
          position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
        }}
      >
        <div style={{
          width: '16px', height: '16px', borderRadius: '50%', background: 'white',
          position: 'absolute', top: '3px', left: on ? '21px' : '3px',
          transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('billing')
  const [theme, setTheme] = useState('dark')
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Configure your TradeGuard AI experience</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Sidebar */}
        <div className="glass-card" style={{ padding: '8px' }}>
          {SECTIONS.map(s => (
            <SectionButton key={s.id} {...s} active={activeSection === s.id} onClick={setActiveSection} />
          ))}
        </div>

        {/* Content */}
        <div className="glass-card" style={{ padding: '24px' }}>
          {activeSection === 'billing' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Plan & Billing</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manage your TradeGuard AI subscription.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {/* FREE plan */}
                <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--border-default)', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>FREE</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', marginBottom: '10px' }}>₹0<span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)', marginLeft: '4px' }}>/month</span></div>
                  {['5 watchlist symbols', '5 research/day', 'Journal unlimited', 'No Copilot'].map(f => (
                    <div key={f} style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>· {f}</div>
                  ))}
                </div>
                {/* PRO plan */}
                <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '6px' }}>
                    <Zap size={11} /> PRO
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', marginBottom: '10px' }}>₹499<span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-muted)', marginLeft: '4px' }}>/month</span></div>
                  {['Unlimited watchlist', 'Unlimited research', 'Live Copilot', 'Mind Engine V7'].map(f => (
                    <div key={f} style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Check size={10} color="var(--bull)" /> {f}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setUpgradeOpen(true)}
                style={{
                  width: '100%', padding: '12px', background: 'var(--accent-blue)',
                  color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px',
                  fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                }}
              >
                <Zap size={15} /> Upgrade to PRO — ₹499/month
              </button>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
                Educational analysis, not investment advice. Cancel anytime via Razorpay.
              </p>
              <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
            </>
          )}

          {activeSection === 'api' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>API Keys</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configure external APIs to unlock live data and AI features.</p>
              </div>
              <div style={{ background: 'var(--warning-dim)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '12px', color: 'var(--warning)' }}>
                ⚠ Currently in Prototype Mode — add keys below to enable live features
              </div>
              <ApiKeyField label="Anthropic API Key (Claude AI)" keyName="ANTHROPIC_API_KEY" placeholder="sk-ant-..." />
              <ApiKeyField label="Perplexity API Key (News Search)" keyName="PERPLEXITY_API_KEY" placeholder="pplx-..." />
              <ApiKeyField label="Alpaca Markets API Key" keyName="ALPACA_API_KEY" placeholder="PKXXX..." />
              <ApiKeyField label="Polygon.io API Key" keyName="POLYGON_API_KEY" placeholder="..." />
              <ApiKeyField label="FMP API Key (Financial Data)" keyName="FMP_API_KEY" placeholder="..." />
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Notifications</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Control when and how TradeGuard alerts you.</p>
              </div>
              <Toggle label="High Impact Events" description="Alert on HIGH impact feed events only" defaultOn={true} />
              <Toggle label="Retail Trap Warnings" description="Push notification when retail trap is detected" defaultOn={true} />
              <Toggle label="Watchlist Price Alerts" description="Alert when watched ticker moves ±3%" defaultOn={false} />
              <Toggle label="Morning Brief (9:30 AM)" description="Daily pre-market intelligence brief" defaultOn={true} />
              <Toggle label="Journal Reminder" description="Daily 5PM reminder to log your trades" defaultOn={false} />
            </>
          )}

          {activeSection === 'appearance' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Appearance</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customize the look and feel.</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>Theme</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['dark', 'midnight', 'slate'].map(t => (
                    <button key={t} onClick={() => setTheme(t)} style={{
                      padding: '8px 16px', borderRadius: '8px',
                      border: `1px solid ${theme === t ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                      background: theme === t ? 'rgba(59,130,246,0.1)' : 'var(--bg-subtle)',
                      color: theme === t ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize',
                    }}>
                      {theme === t && <Check style={{ display: 'inline', marginRight: '4px' }} size={11} />}{t}
                    </button>
                  ))}
                </div>
              </div>
              <Toggle label="Compact Sidebar" description="Reduce sidebar to icon-only view" defaultOn={false} />
              <Toggle label="Animated Charts" description="Enable sparkline and chart animations" defaultOn={true} />
            </>
          )}

          {activeSection === 'data' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Data & Privacy</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manage your data and privacy preferences.</p>
              </div>
              <Toggle label="Analytics Opt-in" description="Help improve TradeGuard with anonymous usage data" defaultOn={false} />
              <Toggle label="Journal Encryption" description="Encrypt journal entries at rest" defaultOn={true} />
              <div style={{ marginTop: '20px', padding: '14px', background: 'var(--bear-dim)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--bear)', marginBottom: '6px' }}>Danger Zone</div>
                <button className="btn-ghost" style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'var(--bear)', fontSize: '12px' }}>
                  Clear All Journal Data
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

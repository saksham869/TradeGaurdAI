"use client"

import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Target } from 'lucide-react'

interface GroupStats {
  winRate: number
  expectancyR: number
  sampleSize: number
}

interface TraderModelData {
  calibrated: boolean
  totalClosedTrades: number
  totalJournals: number
  winRate: number | null
  avgWinR: number | null
  avgLossR: number | null
  expectancyR: number | null
  profitFactor: number | null
  statsBySetup: Record<string, GroupStats | { _lowSample: true; n: number }>
  statsByRegime: Record<string, GroupStats | { _lowSample: true; n: number }>
  statsByHour: Record<string, GroupStats | { _lowSample: true; n: number }>
  behavioralFlags: Array<{ flag: string; evidence: string; sampleSize: number }>
  convictionCalib: Record<string, GroupStats | { _lowSample: true; n: number }>
}

function isStats(v: unknown): v is GroupStats {
  return typeof v === 'object' && v !== null && 'winRate' in v
}

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'6px 0', borderBottom:'1px solid var(--border-muted)' }}>
      <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize:'13px', fontWeight:'700', fontFamily:'JetBrains Mono,monospace', color:'var(--text-primary)' }}>
        {value}
        {sub && <span style={{ fontSize:'10px', color:'var(--text-muted)', marginLeft:'4px' }}>{sub}</span>}
      </span>
    </div>
  )
}

function StatsTable({ data, label }: { data: Record<string, GroupStats | { _lowSample: true; n: number }>; label: string }) {
  const entries = Object.entries(data).filter(([k]) => !k.startsWith('_'))
  if (entries.length === 0) return null
  return (
    <div style={{ marginBottom:'16px' }}>
      <div style={{ fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'6px' }}>{label}</div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left', padding:'4px 0', color:'var(--text-muted)', fontWeight:'600', fontSize:'11px' }}>Setup</th>
            <th style={{ textAlign:'right', padding:'4px 0', color:'var(--text-muted)', fontWeight:'600', fontSize:'11px' }}>W%</th>
            <th style={{ textAlign:'right', padding:'4px 0', color:'var(--text-muted)', fontWeight:'600', fontSize:'11px' }}>Exp</th>
            <th style={{ textAlign:'right', padding:'4px 0', color:'var(--text-muted)', fontWeight:'600', fontSize:'11px' }}>n</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, val]) => (
            <tr key={key}>
              <td style={{ padding:'4px 0', color:'var(--text-secondary)' }}>{key}</td>
              {isStats(val) ? (
                <>
                  <td style={{ padding:'4px 0', textAlign:'right', fontFamily:'JetBrains Mono,monospace', color: val.winRate >= 0.55 ? 'var(--bull)' : val.winRate < 0.45 ? 'var(--bear)' : 'var(--text-secondary)' }}>
                    {(val.winRate * 100).toFixed(0)}%
                  </td>
                  <td style={{ padding:'4px 0', textAlign:'right', fontFamily:'JetBrains Mono,monospace', color: val.expectancyR > 0 ? 'var(--bull)' : 'var(--bear)' }}>
                    {val.expectancyR >= 0 ? '+' : ''}{val.expectancyR.toFixed(2)}R
                  </td>
                  <td style={{ padding:'4px 0', textAlign:'right', color:'var(--text-muted)', fontSize:'11px' }}>n={val.sampleSize}</td>
                </>
              ) : (
                <td colSpan={3} style={{ padding:'4px 0', textAlign:'right', color:'var(--text-muted)', fontSize:'11px' }}>
                  low sample (n={(val as { _lowSample: true; n: number }).n})
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface Props {
  compact?: boolean  // compact version for /journal page
}

export default function TraderModelCard({ compact = false }: Props) {
  const [model, setModel] = useState<TraderModelData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trader-model')
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setModel(d.data) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass-card" style={{ padding:'20px', minHeight:'80px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>Loading trader model…</span>
      </div>
    )
  }

  if (!model || !model.calibrated) {
    const trades   = model?.totalClosedTrades ?? 0
    const journals = model?.totalJournals ?? 0
    return (
      <div className="glass-card" style={{ padding:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
          <Target size={16} color="var(--text-muted)" />
          <span style={{ fontSize:'13px', fontWeight:'700', color:'var(--text-primary)' }}>TraderModel</span>
          <span style={{ padding:'2px 8px', borderRadius:'100px', background:'var(--bg-subtle)', color:'var(--text-muted)', fontSize:'11px', fontWeight:'600' }}>CALIBRATING</span>
        </div>
        <div style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'12px' }}>
          Requires 20 closed trades and 10 journal entries to calibrate.
        </div>
        <div style={{ display:'flex', gap:'12px' }}>
          {[
            { label:'Trades', value: trades, need: 20 },
            { label:'Journals', value: journals, need: 10 },
          ].map(({ label, value, need }) => (
            <div key={label} style={{ flex:1 }}>
              <div style={{ fontSize:'11px', color:'var(--text-muted)', marginBottom:'4px' }}>{label}</div>
              <div style={{ background:'var(--bg-subtle)', borderRadius:'4px', height:'6px', overflow:'hidden', marginBottom:'4px' }}>
                <div style={{ width:`${Math.min(100, (value/need)*100)}%`, height:'100%', background:'var(--accent)', borderRadius:'4px', transition:'width 0.3s' }} />
              </div>
              <div style={{ fontSize:'11px', fontWeight:'700', fontFamily:'JetBrains Mono,monospace', color:'var(--text-secondary)' }}>{value}/{need}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const expColor = (model.expectancyR ?? 0) > 0 ? 'var(--bull)' : 'var(--bear)'

  if (compact) {
    return (
      <div className="glass-card" style={{ padding:'16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
          <span style={{ fontSize:'12px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>TraderModel</span>
          <span style={{ fontSize:'10px', color:'var(--bull)', fontWeight:'600' }}>CALIBRATED</span>
        </div>
        <div style={{ display:'flex', gap:'16px' }}>
          <div>
            <div style={{ fontSize:'22px', fontWeight:'700', fontFamily:'JetBrains Mono,monospace', color:expColor }}>
              {(model.expectancyR ?? 0) >= 0 ? '+' : ''}{(model.expectancyR ?? 0).toFixed(2)}R
            </div>
            <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>Expectancy</div>
          </div>
          <div>
            <div style={{ fontSize:'22px', fontWeight:'700', fontFamily:'JetBrains Mono,monospace', color:'var(--text-primary)' }}>
              {((model.winRate ?? 0) * 100).toFixed(0)}%
              <span style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:'400', marginLeft:'2px' }}>(n={model.totalClosedTrades})</span>
            </div>
            <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>Win rate</div>
          </div>
        </div>
        {model.behavioralFlags.length > 0 && (
          <div style={{ marginTop:'10px', display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'var(--warning)' }}>
            <AlertTriangle size={12} />
            {model.behavioralFlags.length} behavioral flag{model.behavioralFlags.length > 1 ? 's' : ''} — see /mind
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="glass-card" style={{ padding:'20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <Target size={16} color="var(--accent)" />
          <span style={{ fontSize:'14px', fontWeight:'700', color:'var(--text-primary)' }}>TraderModel</span>
          <span style={{ padding:'2px 8px', borderRadius:'100px', background:'var(--bull-dim)', color:'var(--bull)', fontSize:'11px', fontWeight:'600' }}>CALIBRATED</span>
        </div>
        <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>{model.totalClosedTrades} trades · {model.totalJournals} journals</span>
      </div>

      {/* Headline metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' }}>
        <div style={{ textAlign:'center', padding:'12px', borderRadius:'8px', background:'var(--bg-subtle)' }}>
          <div style={{ fontSize:'24px', fontWeight:'700', fontFamily:'JetBrains Mono,monospace', color:expColor }}>
            {(model.expectancyR ?? 0) >= 0 ? '+' : ''}{(model.expectancyR ?? 0).toFixed(2)}R
          </div>
          <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'2px' }}>Expectancy (n={model.totalClosedTrades})</div>
        </div>
        <div style={{ textAlign:'center', padding:'12px', borderRadius:'8px', background:'var(--bg-subtle)' }}>
          <div style={{ fontSize:'24px', fontWeight:'700', fontFamily:'JetBrains Mono,monospace', color:'var(--text-primary)' }}>
            {((model.winRate ?? 0) * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'2px' }}>Win rate (n={model.totalClosedTrades})</div>
        </div>
        <div style={{ textAlign:'center', padding:'12px', borderRadius:'8px', background:'var(--bg-subtle)' }}>
          <div style={{ fontSize:'24px', fontWeight:'700', fontFamily:'JetBrains Mono,monospace', color:'var(--text-primary)' }}>
            {model.profitFactor != null ? model.profitFactor.toFixed(2) : '—'}
          </div>
          <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'2px' }}>Profit factor</div>
        </div>
      </div>

      {/* Win / Loss R */}
      <div style={{ marginBottom:'20px' }}>
        <StatRow label="Avg Win" value={`+${(model.avgWinR ?? 0).toFixed(2)}R`} />
        <StatRow label="Avg Loss" value={`${(model.avgLossR ?? 0).toFixed(2)}R`} />
      </div>

      {/* Behavioral flags */}
      {model.behavioralFlags.length > 0 && (
        <div style={{ marginBottom:'20px' }}>
          <div style={{ fontSize:'11px', fontWeight:'700', color:'var(--warning)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'8px' }}>
            Behavioral Flags
          </div>
          {model.behavioralFlags.map(f => (
            <div key={f.flag} style={{ display:'flex', gap:'8px', padding:'10px 12px', borderRadius:'8px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', marginBottom:'8px' }}>
              <AlertTriangle size={14} color="var(--warning)" style={{ flexShrink:0, marginTop:'1px' }} />
              <div>
                <div style={{ fontSize:'12px', fontWeight:'700', color:'var(--warning)', marginBottom:'2px' }}>{f.flag.replace(/_/g,' ')}</div>
                <div style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{f.evidence}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats tables */}
      <StatsTable data={model.statsBySetup}  label="By Setup" />
      <StatsTable data={model.statsByRegime} label="By Regime" />
      <StatsTable data={model.statsByHour}   label="By Hour" />
      <StatsTable data={model.convictionCalib} label="Conviction Calibration" />

      <p style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'8px' }}>
        Stats with n&lt;5 shown as &ldquo;low sample&rdquo; and excluded from recommendations.
      </p>
    </div>
  )
}

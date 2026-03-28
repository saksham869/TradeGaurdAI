"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TickerDashboard({ symbol, data, loading }: { symbol: string, data: any, loading: boolean }) {
  if (loading) {
    return <div className="text-center text-secondary py-10 font-mono-prices">Analyzing {symbol}...</div>
  }

  if (!data) {
    return <div className="text-center text-muted py-10">Search for a ticker to see parallel AI analysis.</div>
  }

  const { newsImpact, technicalRead, retailTrapAnalysis, synthesis } = data

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Left Column: Price Chart / Levels */}
      <Card className="bg-surface border-border">
        <CardHeader><CardTitle className="text-sm text-secondary">Chart & Levels</CardTitle></CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center text-muted font-mono-prices text-xs">
           [Price Chart - TradingView Setup V1]
        </CardContent>
      </Card>

      {/* Right Column: Stacked perspectives */}
      <div className="space-y-4">
        {/* News Impact */}
        <Card className="bg-subtle border-border hover:border-amber/40 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-amber tracking-wider">1. NEWS IMPACT</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-bold text-primary">{newsImpact?.headline || 'No major recent developments.'}</p>
            <p className="text-sm text-secondary mt-1">{newsImpact?.newsImpact}</p>
          </CardContent>
        </Card>

        {/* Technical Read */}
        <Card className="bg-subtle border-border hover:border-amber/40 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-amber tracking-wider">2. TECHNICAL READ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-primary">
              <span className="text-muted">Trend:</span> 
              <span className="font-bold">{technicalRead?.trend || 'N/A'}</span>
            </div>
            <p className="text-sm text-secondary mt-1">{technicalRead?.technicalSummary}</p>
          </CardContent>
        </Card>

        {/* Retail Trap Warning */}
        <Card className="bg-subtle border-border hover:border-amber/40 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-extreme tracking-wider">3. RETAIL TRAP</CardTitle>
          </CardHeader>
          <CardContent>
            {retailTrapAnalysis?.trapActive ? (
                <div className="bg-red-500/10 p-2 rounded border border-red-500/20 text-extreme">
                   <p className="text-sm font-bold">{retailTrapAnalysis.retailMistake}</p>
                   <p className="text-xs text-secondary mt-1">Smart Money: {retailTrapAnalysis.institutionalView}</p>
                </div>
            ) : (
                <p className="text-sm text-secondary">No active retail traps identified.</p>
            )}
          </CardContent>
        </Card>

        {/* Recommendation Banner */}
        <div className={`p-4 rounded border font-bold text-center tracking-wider text-sm ${
            synthesis?.recommendation === 'STRONG_AVOID' ? 'bg-bear/10 border-bear text-bear' :
            synthesis?.recommendation === 'FAVORABLE' ? 'bg-bull/10 border-bull text-bull' : 'bg-subtle text-amber border-amber'
        }`}>
            {synthesis?.recommendation ? `RECOMMENDATION: ${synthesis.recommendation.replace('_', ' ')}` : 'NEUTRAL SETUP'}
        </div>
      </div>
    </div>
  )
}

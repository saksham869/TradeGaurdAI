import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function FeedItem({ event }: { event: any }) {
  if (!event) return null;
  const analysis = event.aiAnalysis || {}
  
  return (
    <Card className="mb-4 bg-surface border-border hover:border-amber/50 transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="font-mono-prices text-amber border-amber/40">{event.symbol || 'MARKET'}</Badge>
          <Badge className="bg-subtle text-secondary">{event.eventType}</Badge>
          {event.impactLevel === 'HIGH' && (
             <Badge className="bg-bear text-white">HIGH IMPACT</Badge>
          )}
        </div>
        <span className="text-xs text-muted">{new Date(event.publishedAt).toLocaleTimeString()}</span>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-base font-bold mb-2 text-primary">{event.headline}</CardTitle>
        
        <div className="space-y-3 pt-2">
          <div>
            <span className="text-xs font-bold text-amber tracking-wider">WHAT HAPPENED</span>
            <p className="text-sm text-secondary mt-1">{analysis.whatHappened || 'Loading...'}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-amber tracking-wider">WHAT IT MEANS</span>
            <p className="text-sm text-secondary mt-1">{analysis.whatItMeans}</p>
          </div>
          {analysis.retailMistake && (
            <div className="bg-red-500/10 p-2 rounded border border-red-500/20 mt-2">
              <span className="text-xs font-bold text-extreme flex items-center space-x-1">
                <span>⚠️ RETAIL MISTAKE</span>
              </span>
              <p className="text-sm text-secondary mt-1">{analysis.retailMistake}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 border-t pt-3">
          <div className="flex items-center space-x-2">
             <span className="text-xs text-muted">Sentiment:</span> 
             <span className={`text-xs font-bold ${event.sentimentScore > 50 ? 'text-bull' : 'text-bear'}`}>
               {event.sentimentLabel || 'NEUTRAL'}
             </span>
          </div>
          <span className="text-xs font-mono-prices text-primary font-bold">{event.sentimentScore}/100</span>
        </div>
      </CardContent>
    </Card>
  )
}

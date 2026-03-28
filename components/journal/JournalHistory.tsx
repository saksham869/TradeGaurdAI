"use client"

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function JournalHistory({ entries }: { entries: any[] }) {
  if (entries.length === 0) {
     return <div className="text-center text-muted py-10">No journal logs recorded yet.</div>
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
         const response = entry.aiResponse || null
         
         return (
            <Card key={entry.id} className="bg-surface border-border hover:border-amber/10 transition-all">
              <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
                <span className="text-xs text-secondary font-mono-prices">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
                {entry.symbol && (
                   <Badge variant="outline" className="font-mono-prices text-amber border-amber/40">
                     {entry.symbol}
                   </Badge>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm text-primary mb-3 leading-relaxed">{entry.rawText}</p>
                
                {response && response.whatYourThinkingShows && (
                   <div className="bg-subtle/50 p-3 rounded border border-border mt-2 space-y-2">
                      <div>
                         <span className="text-xs font-bold text-amber tracking-wider">🧠 AI Coach Analysis</span>
                         <p className="text-xs text-secondary mt-1">{response.whatYourThinkingShows}</p>
                      </div>
                      
                      {response.patternMatch && (
                         <div className="flex items-center space-x-1 text-xs text-primary">
                            <span className="text-muted">Pattern:</span>
                            <span className="font-semibold text-amber">{response.patternMatch}</span>
                         </div>
                      )}

                      {response.oneThing && (
                         <div className="flex items-center space-x-1 text-xs text-primary">
                            <span className="text-muted">Tip for tomorrow:</span>
                            <span className="font-semibold text-bull">{response.oneThing}</span>
                         </div>
                      )}
                   </div>
                )}
              </CardContent>
            </Card>
         )
      })}
    </div>
  )
}

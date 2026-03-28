"use client"

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function JournalForm({ onSubmit }: { onSubmit: (text: string, symbol?: string) => void }) {
  const [text, setText] = useState('')
  const [symbol, setSymbol] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSubmit(text, symbol ? symbol.toUpperCase().trim() : undefined)
      setText('')
      setSymbol('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-surface p-4 rounded border border-border">
      <div>
        <label className="text-xs font-bold text-secondary tracking-wider">TICKER (OPTIONAL)</label>
        <Input 
          placeholder="e.g. TSLA" 
          value={symbol} 
          onChange={(e) => setSymbol(e.target.value)}
          className="font-mono-prices bg-subtle mt-1"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-secondary tracking-wider">NOTES</label>
        <Textarea 
          placeholder="Write freely — what did you see today? Any mistakes or FOMO?" 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="bg-subtle mt-1 border-border focus-visible:ring-amber-500"
        />
      </div>

      <Button type="submit" className="w-full bg-amber text-black hover:bg-amber/90 font-bold">
        Reflect with AI →
      </Button>
    </form>
  )
}

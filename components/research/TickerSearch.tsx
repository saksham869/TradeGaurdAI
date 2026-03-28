"use client"

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export default function TickerSearch({ onSearch }: { onSearch: (ticker: string) => void }) {
  const [ticker, setTicker] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ticker.trim()) {
      onSearch(ticker.toUpperCase().trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2 max-w-md w-full">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
        <Input 
          placeholder="Search Ticker (e.g. AAPL, MSFT)" 
          value={ticker} 
          onChange={(e) => setTicker(e.target.value)}
          className="font-mono-prices bg-subtle pl-10 border-border focus-visible:ring-amber-500"
        />
      </div>
      <Button type="submit" className="bg-amber text-black hover:bg-amber/90 font-bold">
        Analyze
      </Button>
    </form>
  )
}

import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

export const metadata: Metadata = {
  title: 'TradeGuard AI',
  description: 'Parallel Multi-Agent Financial Intelligence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  const content = (
    <html lang="en" className="dark">
      <body className="bg-background text-primary antialiased">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )

  if (!publishableKey) {
     return content
  }

  return (
    <ClerkProvider>
       {content}
    </ClerkProvider>
  )
}

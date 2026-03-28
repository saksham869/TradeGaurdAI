import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Seeding...')

  const user = await prisma.user.upsert({
    where: { email: 'trader@tradeguard.ai' },
    update: {},
    create: {
      clerkId: 'user_v1_prototype',
      email: 'trader@tradeguard.ai',
      name: 'TradeGuard Prototype',
      plan: 'PRO',
    },
  })

  console.log(`Created user with ID: ${user.id}`)

  // Create Watchlist
  await prisma.watchlistItem.upsert({
    where: { userId_symbol: { userId: user.id, symbol: 'TSLA' } },
    update: {},
    create: {
      userId: user.id,
      symbol: 'TSLA',
      assetClass: 'STOCK',
    },
  })

  await prisma.watchlistItem.upsert({
    where: { userId_symbol: { userId: user.id, symbol: 'NVDA' } },
    update: {},
    create: {
      userId: user.id,
      symbol: 'NVDA',
      assetClass: 'STOCK',
    },
  })

  // Create Sample feed event for visual testing
  await prisma.feedEvent.create({
    data: {
      symbol: 'NVDA',
      eventType: 'NEWS',
      headline: 'NVIDIA hits absolute highs in market hours.',
      source: 'Internal Scanner',
      sourceUrl: 'https://tradeguard.ai',
      rawSummary: 'Visual test data event for initial dashboard testing.',
      sentimentScore: 85,
      sentimentLabel: 'BULLISH',
      impactLevel: 'HIGH',
      aiAnalysis: {
         whatHappened: 'NVIDIA stock achieved a new peak during session.',
         whatItMeans: 'Strong accumulation continues driver AI momentum.',
         retailMistake: 'Entering long with high leverage right on overhead resistance levels.',
      },
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h from now
    }
  })

  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

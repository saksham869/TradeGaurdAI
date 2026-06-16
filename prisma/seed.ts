import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding India demo user…')

  // India-flavored PRO demo user (IST timezone, INR currency)
  const user = await prisma.user.upsert({
    where: { email: 'demo@tradeguard.app' },
    update: {},
    create: {
      clerkId: 'user_demo_india_v1',
      email: 'demo@tradeguard.app',
      name: 'Arjun Sharma',
      plan: 'PRO',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      onboarded: true,
    },
  })

  console.log(`  user: ${user.id} (${user.email})`)

  // Watchlist — NSE blue chips + US tech
  const watchlist = [
    { symbol: 'RELIANCE.NS', assetClass: 'STOCK' as const, exchange: 'NSE' },
    { symbol: 'TCS.NS',      assetClass: 'STOCK' as const, exchange: 'NSE' },
    { symbol: 'INFY.NS',     assetClass: 'STOCK' as const, exchange: 'NSE' },
    { symbol: 'HDFCBANK.NS', assetClass: 'STOCK' as const, exchange: 'NSE' },
    { symbol: 'ICICIBANK.NS',assetClass: 'STOCK' as const, exchange: 'NSE' },
    { symbol: 'NIFTYBEES.NS',assetClass: 'ETF'   as const, exchange: 'NSE' },
    { symbol: 'NVDA',        assetClass: 'STOCK' as const, exchange: 'NASDAQ' },
    { symbol: 'TSLA',        assetClass: 'STOCK' as const, exchange: 'NASDAQ' },
  ]

  for (const w of watchlist) {
    await prisma.watchlistItem.upsert({
      where: { userId_symbol: { userId: user.id, symbol: w.symbol } },
      update: {},
      create: { userId: user.id, ...w },
    })
  }
  console.log(`  watchlist: ${watchlist.length} symbols`)

  // Open positions
  const pos1 = await prisma.position.upsert({
    where: { id: 'seed_pos_reliance' } as never,
    update: {},
    create: {
      id: 'seed_pos_reliance',
      userId: user.id,
      symbol: 'RELIANCE.NS',
      assetClass: 'STOCK',
      side: 'LONG',
      entryPrice: 2950.00,
      quantity: 20,
      stopLoss: 2850.00,
      targetPrice: 3200.00,
      status: 'OPEN',
      notes: 'Breakout above 200-DMA on strong volume. Q4 refinery margins expanding.',
    },
  })

  await prisma.position.upsert({
    where: { id: 'seed_pos_infy' } as never,
    update: {},
    create: {
      id: 'seed_pos_infy',
      userId: user.id,
      symbol: 'INFY.NS',
      assetClass: 'STOCK',
      side: 'LONG',
      entryPrice: 1580.00,
      quantity: 50,
      stopLoss: 1490.00,
      targetPrice: 1750.00,
      status: 'OPEN',
      notes: 'Large deal win cycle post-Q4 guidance. RSI reversal from oversold.',
    },
  })
  console.log('  positions: 2 open (RELIANCE.NS, INFY.NS)')

  // Journal entries with India market context
  const journalEntries = [
    {
      rawText: 'Bought RELIANCE.NS at 2950 after seeing strong accumulation at the weekly support. Momentum looks good but I need to watch oil prices — Jio retail data this week could be a catalyst. Felt confident but not FOMO. Keeping position small.',
      symbol: 'RELIANCE.NS',
      emotionTag: 'DISCIPLINED' as const,
      aiResponse: {
        whatYourThinkingShows: 'Structured, risk-aware entry. You referenced a specific catalyst and sized appropriately.',
        patternMatch: 'Disciplined breakout entry. No impulsive sizing.',
        oneThing: 'Pre-define your stop mentally BEFORE entry — it removes the exit emotion.',
        encouragement: 'This is what good process looks like. Keep it up.',
        emotionTag: 'DISCIPLINED',
        riskLevel: 'LOW',
      },
      processingStatus: 'complete',
    },
    {
      rawText: 'Nifty dropped 1.2% today on US rate fears. I almost panic-sold my INFY position at a loss but held because my stop was not hit. The urge to sell was strong — felt like everyone knew something I did not. Eventually steadied.',
      symbol: 'INFY.NS',
      emotionTag: 'FEARFUL' as const,
      aiResponse: {
        whatYourThinkingShows: 'Fear of missing a move others are seeing. Classic macro scare response.',
        patternMatch: 'Near-panic selling on macro noise — stop was not triggered but you nearly overrode it.',
        oneThing: 'Write down in advance: "I will only exit if my stop at ₹1490 is hit." Prevents in-session panic.',
        encouragement: 'You held the plan. That discipline compounds over hundreds of trades.',
        emotionTag: 'FEARFUL',
        riskLevel: 'MEDIUM',
      },
      processingStatus: 'complete',
    },
    {
      rawText: 'Made 3 trades today — 2 winners, 1 loser. Net positive. The loser was TCS where I entered on hype without checking the quarterly result date. Lesson: always check event calendar before entering a position.',
      symbol: 'TCS.NS',
      emotionTag: 'DISCIPLINED' as const,
      aiResponse: {
        whatYourThinkingShows: 'Post-session self-reflection with a specific, actionable takeaway. Good sign.',
        patternMatch: 'Hype-driven entry without event awareness — classic retail trap. You caught it yourself.',
        oneThing: 'Add "check earnings date" to your pre-trade checklist. One line saves expensive surprises.',
        encouragement: 'A day that costs you a lesson and still ends green is a great day.',
        emotionTag: 'DISCIPLINED',
        riskLevel: 'LOW',
      },
      processingStatus: 'complete',
    },
  ]

  for (const j of journalEntries) {
    await prisma.journalEntry.create({
      data: {
        userId: user.id,
        rawText: j.rawText,
        symbol: j.symbol,
        emotionTag: j.emotionTag,
        aiResponse: j.aiResponse,
        processingStatus: j.processingStatus,
        tradedToday: true,
      },
    })
  }
  console.log(`  journal: ${journalEntries.length} entries`)

  // PsychProfile
  await prisma.psychProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      totalEntries: journalEntries.length,
      streakDays: 3,
      longestStreak: 7,
      dominantTag: 'DISCIPLINED',
      tagFrequency: { DISCIPLINED: 2, FEARFUL: 1 },
    },
  })
  console.log('  psychProfile: created')

  // Feed events with India context
  await prisma.feedEvent.createMany({
    data: [
      {
        symbol: 'RELIANCE.NS',
        assetClass: 'STOCK',
        eventType: 'NEWS',
        headline: 'Reliance Jio adds 8.4 million subscribers in March — beats street estimate',
        source: 'Economic Times',
        sourceUrl: 'https://economictimes.indiatimes.com',
        rawSummary: 'Jio subscriber growth accelerated in Q4 driven by affordable 5G plans in Tier-2 cities.',
        aiAnalysis: {
          whatHappened: 'Jio Q4 subscriber addition of 8.4M beat analyst estimate of 6.8M.',
          whatItMeans: 'Positive for ARPU growth and Reliance\'s digital segment margins in FY26.',
          retailMistake: 'Buying at open gap-up without waiting for price discovery to settle.',
        },
        sentimentScore: 78,
        sentimentLabel: 'BULLISH',
        impactLevel: 'HIGH',
        publishedAt: new Date(Date.now() - 2 * 3600_000),
        expiresAt: new Date(Date.now() + 22 * 3600_000),
      },
      {
        symbol: 'NIFTY50',
        assetClass: 'ETF',
        eventType: 'ECONOMIC_EVENT',
        headline: 'RBI holds repo rate at 6.5% — policy stance shifts to neutral',
        source: 'RBI Press Release',
        sourceUrl: 'https://rbi.org.in',
        rawSummary: 'MPC voted 4-2 to hold rates. Governor flagged food inflation risks but signalled rate cut possibility in Aug.',
        aiAnalysis: {
          whatHappened: 'RBI MPC held repo rate at 6.5% with a shift from "withdrawal of accommodation" to "neutral".',
          whatItMeans: 'Rate cut likely in Aug-Oct 2025. Positive for banking, housing, and rate-sensitive sectors.',
          retailMistake: 'Going heavily long on banking stocks immediately post-announcement without waiting for follow-through.',
        },
        sentimentScore: 65,
        sentimentLabel: 'BULLISH',
        impactLevel: 'HIGH',
        publishedAt: new Date(Date.now() - 6 * 3600_000),
        expiresAt: new Date(Date.now() + 18 * 3600_000),
      },
      {
        symbol: 'TCS.NS',
        assetClass: 'STOCK',
        eventType: 'EARNINGS',
        headline: 'TCS Q4 PAT ₹12,434 Cr — in-line with estimates; deal wins ₹13.2B',
        source: 'TCS Investor Relations',
        sourceUrl: 'https://tcs.com/investor-relations',
        rawSummary: 'TCS Q4 revenue grew 5.4% YoY to ₹61,237 Cr. EBIT margin at 24.5%. FY26 hiring guidance of 40K freshers.',
        aiAnalysis: {
          whatHappened: 'TCS Q4 results in-line. Deal pipeline strong. Management guided for improvement in H2 FY26.',
          whatItMeans: 'No negative surprise — relief rally likely. IT sector rotation could follow if US macro stabilises.',
          retailMistake: 'Selling the stock before results on fear — results came in as expected.',
        },
        sentimentScore: 60,
        sentimentLabel: 'NEUTRAL',
        impactLevel: 'MEDIUM',
        publishedAt: new Date(Date.now() - 12 * 3600_000),
        expiresAt: new Date(Date.now() + 12 * 3600_000),
      },
    ],
    skipDuplicates: true,
  })
  console.log('  feed: 3 India-context events')

  // Preserve legacy prototype user for backward compat
  await prisma.user.upsert({
    where: { email: 'trader@tradeguard.ai' },
    update: {},
    create: {
      clerkId: 'user_v1_prototype',
      email: 'trader@tradeguard.ai',
      name: 'TradeGuard Prototype',
      plan: 'PRO',
    },
  })

  console.log('\nSeeding completed successfully.')
  console.log(`  Demo user → email: demo@tradeguard.app`)
  console.log(`  Demo positions: RELIANCE.NS @ ₹2950, INFY.NS @ ₹1580`)
}

main()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

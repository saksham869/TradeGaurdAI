import { PrismaClient, Prisma } from '@prisma/client'
import { recomputeTraderModel } from '../lib/services/traderModel.service'

const prisma = new PrismaClient()

// Fixed "today" for deterministic seeding
const TODAY = new Date('2026-06-17T00:00:00.000Z')

function daysAgo(n: number): Date {
  return new Date(TODAY.getTime() - n * 24 * 60 * 60 * 1000)
}

// Returns a Date set to the given IST time on the given base date.
// IST = UTC+5:30, so UTC = IST − 5h30m. JavaScript handles negative minutes.
function atIST(base: Date, istHour: number, istMin = 0): Date {
  const d = new Date(base)
  d.setUTCHours(istHour - 5, istMin - 30, 0, 0)
  return d
}

async function main() {
  console.log('Seeding India demo user…')

  // Use the fixed prototype ID so ALLOW_PROTOTYPE_USER routes resolve correctly
  const user = await prisma.user.upsert({
    where: { id: 'user_v1_prototype' },
    update: { plan: 'PRO', name: 'Arjun Sharma', timezone: 'Asia/Kolkata', currency: 'INR', onboarded: true },
    create: {
      id: 'user_v1_prototype',
      clerkId: 'user_v1_prototype',
      email: 'demo@tradeguard.ai',
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
  await prisma.trade.upsert({
    where: { id: 'seed_pos_reliance' } as never,
    update: {},
    create: {
      id: 'seed_pos_reliance',
      userId: user.id, symbol: 'RELIANCE.NS', assetClass: 'STOCK', direction: 'LONG',
      entryPrice: 2950, quantity: 20, stopLoss: 2850, takeProfit: 3200, status: 'OPEN',
      setupTag: 'range-reversal', statedConviction: 4, regimeAtEntry: 'CHOP',
      notes: 'Breakout above 200-DMA on strong volume. Q4 refinery margins expanding.',
    },
  })
  await prisma.trade.upsert({
    where: { id: 'seed_pos_infy' } as never,
    update: {},
    create: {
      id: 'seed_pos_infy',
      userId: user.id, symbol: 'INFY.NS', assetClass: 'STOCK', direction: 'LONG',
      entryPrice: 1580, quantity: 50, stopLoss: 1490, takeProfit: 1750, status: 'OPEN',
      setupTag: 'breakout-chase', statedConviction: 3, regimeAtEntry: 'CHOP',
      notes: 'Large deal win cycle post-Q4 guidance. RSI reversal from oversold.',
    },
  })
  console.log('  open positions: 2 (RELIANCE.NS, INFY.NS)')

  // ── 30 closed trades ──────────────────────────────────────────────────────
  // Designed so that all 4 TraderModel behavioral flags fire after recompute.
  //
  // OVERSIZE_AFTER_WINS  — 5× WIN WIN BIG pattern (BIG = 3× normal qty after 2 wins)
  // LATE_DAY_LEAK        — 9 late-day (14:30 IST) breakout losses drag late expectancy
  // CONVICTION_INVERTED  — 5★ trades (breakout-chase) all lose; 1★ (range-reversal) all win
  // REVENGE_FAST_REENTRY — 3 loss → same-setupTag re-entry within 8 min pairs

  await prisma.trade.deleteMany({ where: { userId: user.id, status: 'CLOSED' } })

  const closed: Prisma.TradeCreateManyInput[] = []

  // Group A: WIN WIN BIG × 5 (range-reversal, morning 9:30 IST, days 60–46 ago)
  for (let t = 0; t < 5; t++) {
    const [dW1, dW2, dBig] = [60 - t * 3, 59 - t * 3, 58 - t * 3]
    const regime = t < 2 ? 'BULL_TREND' : 'CHOP'

    // W1 (1★ conviction — for CONVICTION_INVERTED: low-star wins)
    closed.push({
      id: `seed_t_a${t}_w1`,
      userId: user.id, symbol: 'RELIANCE.NS', assetClass: 'STOCK', direction: 'LONG',
      entryPrice: 2950, exitPrice: 3100, quantity: 10, stopLoss: 2850,
      entryTime: atIST(daysAgo(dW1), 9, 30), exitTime: atIST(daysAgo(dW1), 10, 30),
      status: 'CLOSED', pnl: 1500, pnlPct: 5.08, rMultiple: 1.5,
      setupTag: 'range-reversal', statedConviction: 1, regimeAtEntry: regime,
    })

    // W2 (3★ conviction)
    closed.push({
      id: `seed_t_a${t}_w2`,
      userId: user.id, symbol: 'RELIANCE.NS', assetClass: 'STOCK', direction: 'LONG',
      entryPrice: 2950, exitPrice: 3100, quantity: 10, stopLoss: 2850,
      entryTime: atIST(daysAgo(dW2), 9, 30), exitTime: atIST(daysAgo(dW2), 10, 30),
      status: 'CLOSED', pnl: 1500, pnlPct: 5.08, rMultiple: 1.5,
      setupTag: 'range-reversal', statedConviction: 3, regimeAtEntry: regime,
    })

    // BIG (3★ conviction, 3× quantity = OVERSIZE trigger)
    closed.push({
      id: `seed_t_a${t}_big`,
      userId: user.id, symbol: 'RELIANCE.NS', assetClass: 'STOCK', direction: 'LONG',
      entryPrice: 2950, exitPrice: 3050, quantity: 30, stopLoss: 2850,
      entryTime: atIST(daysAgo(dBig), 9, 30), exitTime: atIST(daysAgo(dBig), 10, 30),
      status: 'CLOSED', pnl: 3000, pnlPct: 3.39, rMultiple: 1.0,
      setupTag: 'range-reversal', statedConviction: 3, regimeAtEntry: 'CHOP',
    })
  }

  // Group B: Late-day breakout losses × 9 (14:30 IST, days 45–37 ago)
  // 5★ conviction for first 5 (CONVICTION_INVERTED: high-star losses)
  for (let i = 0; i < 9; i++) {
    closed.push({
      id: `seed_t_b${i}`,
      userId: user.id, symbol: 'INFY.NS', assetClass: 'STOCK', direction: 'LONG',
      entryPrice: 1580, exitPrice: 1480, quantity: 5, stopLoss: 1480,
      entryTime: atIST(daysAgo(45 - i), 14, 30), exitTime: atIST(daysAgo(45 - i), 15, 0),
      status: 'CLOSED', pnl: -500, pnlPct: -6.33, rMultiple: -1.0,
      setupTag: 'breakout-chase', statedConviction: i < 5 ? 5 : 3, regimeAtEntry: 'CHOP',
    })
  }

  // Group C: Revenge clusters × 3 (days 22, 18, 14 ago)
  // Each cluster: loss at 10:00 IST, re-entry at 10:08 IST (8 min gap < 15 min threshold)
  for (let i = 0; i < 3; i++) {
    const day = [22, 18, 14][i]
    closed.push({
      id: `seed_t_c${i}_loss`,
      userId: user.id, symbol: 'INFY.NS', assetClass: 'STOCK', direction: 'LONG',
      entryPrice: 1580, exitPrice: 1480, quantity: 5, stopLoss: 1480,
      entryTime: atIST(daysAgo(day), 10, 0), exitTime: atIST(daysAgo(day), 10, 5),
      status: 'CLOSED', pnl: -500, pnlPct: -6.33, rMultiple: -1.0,
      setupTag: 'breakout-chase', statedConviction: 3, regimeAtEntry: 'CHOP',
    })
    closed.push({
      id: `seed_t_c${i}_reentry`,
      userId: user.id, symbol: 'INFY.NS', assetClass: 'STOCK', direction: 'LONG',
      entryPrice: 1580, exitPrice: 1530, quantity: 5, stopLoss: 1480,
      entryTime: atIST(daysAgo(day), 10, 8), exitTime: atIST(daysAgo(day), 10, 20),
      status: 'CLOSED', pnl: -250, pnlPct: -3.16, rMultiple: -0.5,
      setupTag: 'breakout-chase', statedConviction: 3, regimeAtEntry: 'CHOP',
    })
  }

  // Sort by entryTime before insert so DB ordering matches recompute expectations
  const sortedClosed = [...closed].sort((a, b) => {
    const at = a.entryTime instanceof Date ? a.entryTime.getTime() : 0
    const bt = b.entryTime instanceof Date ? b.entryTime.getTime() : 0
    return at - bt
  })

  await prisma.trade.createMany({ data: sortedClosed })
  console.log(`  closed trades: ${sortedClosed.length}`)

  // ── 12 journal entries ─────────────────────────────────────────────────────
  await prisma.journalEntry.deleteMany({ where: { userId: user.id } })

  const journals = [
    {
      rawText: 'Bought RELIANCE.NS at 2950 after seeing strong accumulation at the weekly support. Momentum looks good but I need to watch oil prices — Jio retail data this week could be a catalyst. Felt confident but not FOMO. Keeping position small.',
      symbol: 'RELIANCE.NS', emotionTag: 'DISCIPLINED' as const,
      aiResponse: { whatYourThinkingShows: 'Structured, risk-aware entry. You referenced a specific catalyst and sized appropriately.', patternMatch: 'Disciplined breakout entry.', oneThing: 'Pre-define your stop mentally BEFORE entry.', encouragement: 'This is what good process looks like.', emotionTag: 'DISCIPLINED', riskLevel: 'LOW' },
    },
    {
      rawText: 'Nifty dropped 1.2% today on US rate fears. I almost panic-sold my INFY position at a loss but held because my stop was not hit. The urge to sell was strong — felt like everyone knew something I did not. Eventually steadied.',
      symbol: 'INFY.NS', emotionTag: 'FEARFUL' as const,
      aiResponse: { whatYourThinkingShows: 'Fear of missing a move others are seeing. Classic macro scare response.', patternMatch: 'Near-panic selling on macro noise — stop was not triggered but you nearly overrode it.', oneThing: 'Write down in advance: "I will only exit if my stop at ₹1490 is hit."', encouragement: 'You held the plan. That discipline compounds over hundreds of trades.', emotionTag: 'FEARFUL', riskLevel: 'MEDIUM' },
    },
    {
      rawText: 'Made 3 trades today — 2 winners, 1 loser. Net positive. The loser was TCS where I entered on hype without checking the quarterly result date. Lesson: always check event calendar before entering a position.',
      symbol: 'TCS.NS', emotionTag: 'DISCIPLINED' as const,
      aiResponse: { whatYourThinkingShows: 'Post-session self-reflection with a specific, actionable takeaway.', patternMatch: 'Hype-driven entry without event awareness — classic retail trap. You caught it yourself.', oneThing: 'Add "check earnings date" to your pre-trade checklist.', encouragement: 'A day that costs you a lesson and still ends green is a great day.', emotionTag: 'DISCIPLINED', riskLevel: 'LOW' },
    },
    {
      rawText: 'Took 3 losses in a row on INFY — stop hit, re-entered immediately, stopped again twice. Felt frustrated after the second loss and kept going anyway. I know revenge trading destroys accounts. Need to walk away after two stops.',
      symbol: 'INFY.NS', emotionTag: 'REVENGE' as const,
      aiResponse: { whatYourThinkingShows: 'Three rapid re-entries after stops — the revenge trading loop is visible.', patternMatch: 'REVENGE_FAST_REENTRY. You re-entered breakout-chase within 8 minutes of each loss.', oneThing: 'Rule: after 2 consecutive stops on the same setup, close the platform for 1 hour.', encouragement: 'Recognizing this pattern in writing is the first step to breaking it.', emotionTag: 'REVENGE', riskLevel: 'HIGH' },
    },
    {
      rawText: 'Two RELIANCE wins back to back this morning. Then I sized up 3× on the next trade and gave half the profit back. Why do I keep doing this after a winning streak? The plan says fixed sizing.',
      symbol: 'RELIANCE.NS', emotionTag: 'OVERCONFIDENT' as const,
      aiResponse: { whatYourThinkingShows: 'Euphoria-driven size increase after a winning streak — the most common sizing error.', patternMatch: 'OVERSIZE_AFTER_WINS is visible in your data. After 2+ wins, your position size jumps 3×.', oneThing: 'Set a hard rule: position size cannot exceed 1.5× standard regardless of recent P&L.', encouragement: 'Identifying this is worth more than the loss. One rule fixes it permanently.', emotionTag: 'OVERCONFIDENT', riskLevel: 'MEDIUM' },
    },
    {
      rawText: 'Late session INFY trade at 2:30pm — stopped out for -1R again. I know my late-day performance is terrible but I keep trading anyway. Something about the 2-4pm session makes me feel like I am missing moves.',
      symbol: 'INFY.NS', emotionTag: 'FEARFUL' as const,
      aiResponse: { whatYourThinkingShows: 'FOMO in the late session masking as urgency to not miss moves.', patternMatch: 'LATE_DAY_LEAK — your 14:00-16:00 IST expectancy is deeply negative vs your morning expectancy.', oneThing: 'Hard rule: no new entries after 14:00 IST. Set an alarm on your phone.', encouragement: 'Knowing your worst time window is a genuine edge most traders never identify.', emotionTag: 'FEARFUL', riskLevel: 'MEDIUM' },
    },
    {
      rawText: '5-star conviction trade on INFY — felt completely certain. It failed. Meanwhile my range-reversals at 1-2 stars have been my best trades. Something is inverted in how I assign conviction.',
      symbol: 'INFY.NS', emotionTag: 'UNCLEAR' as const,
      aiResponse: { whatYourThinkingShows: 'Noticing a data signal — high conviction underperforms low conviction.', patternMatch: 'CONVICTION_INVERTED. Your 5★ trades win at 0%; your 1★ trades win at 100%.', oneThing: 'Use conviction to size DOWN not up — your certainty correlates with your worst entries.', encouragement: 'This insight is rare. Most traders never discover this about themselves.', emotionTag: 'UNCLEAR', riskLevel: 'MEDIUM' },
    },
    {
      rawText: 'Good discipline today. Only 2 trades, both morning session, followed plan. Stayed off the platform after 1pm. Positive P&L and more importantly — good process.',
      symbol: null, emotionTag: 'DISCIPLINED' as const,
      aiResponse: { whatYourThinkingShows: 'Process-oriented. P&L is secondary to executing the plan correctly.', patternMatch: 'Morning-only trading aligns with your strongest performance window.', oneThing: 'Write down what specifically made today different so you can replicate it.', encouragement: 'This is the version of you that compounds. More of this.', emotionTag: 'DISCIPLINED', riskLevel: 'LOW' },
    },
    {
      rawText: 'Missed a great RELIANCE move today because I was scared after three consecutive losses. Fear of another loss is stopping me from taking valid setups. This is loss aversion in action.',
      symbol: 'RELIANCE.NS', emotionTag: 'FEARFUL' as const,
      aiResponse: { whatYourThinkingShows: 'Loss aversion is now actively costing opportunity — this is the other side of the revenge coin.', patternMatch: 'After loss streaks you trade too small or not at all — opposite of the oversize-after-wins pattern.', oneThing: 'Use your rules as armor: if the setup is valid and risk is sized correctly, take the trade.', encouragement: 'Recognizing fear is the hardest part. Build trust back slowly with small positions.', emotionTag: 'FEARFUL', riskLevel: 'LOW' },
    },
    {
      rawText: 'Session review: I perform well in the morning when markets are orderly. After 2pm everything feels chaotic and my decisions get worse. Going to test a strict 2pm cutoff rule for the next 2 weeks.',
      symbol: null, emotionTag: 'DISCIPLINED' as const,
      aiResponse: { whatYourThinkingShows: 'Data-driven self-analysis. Testing a rule rather than making a vague commitment.', patternMatch: 'Aligning your trading hours with your best performance window is real edge creation.', oneThing: 'Track adherence to the 2pm cutoff for 10 sessions. You need data to validate the rule.', encouragement: 'This is exactly how a professional improves — systematically, with data.', emotionTag: 'DISCIPLINED', riskLevel: 'LOW' },
    },
    {
      rawText: 'Realised I confuse conviction with certainty. High conviction just means I feel strongly — it says nothing about whether the trade will actually work. Edge comes from setups with positive expected value, not from how sure I feel.',
      symbol: null, emotionTag: 'NEUTRAL' as const,
      aiResponse: { whatYourThinkingShows: 'Philosophical clarity on the difference between felt certainty and statistical edge.', patternMatch: 'Your CONVICTION_INVERTED pattern comes exactly from conflating these two things.', oneThing: 'Before any 5★ trade: ask "what is my win rate on this setup?" — not "how certain do I feel?"', encouragement: 'This understanding alone is worth months of expensive learning.', emotionTag: 'NEUTRAL', riskLevel: 'LOW' },
    },
    {
      rawText: 'Full review of my last 30 trades. Range-reversal is my clear edge — positive expectancy, consistent results. Breakout-chase in the late session is destroying P&L. I need to eliminate that combination completely.',
      symbol: null, emotionTag: 'DISCIPLINED' as const,
      aiResponse: { whatYourThinkingShows: 'Structured quantitative review. Acting on what the data shows, not on feelings.', patternMatch: 'This is the most valuable thing you can do — let your own trades guide your strategy.', oneThing: 'Write "No breakout-chase after 14:00 IST" in your trading rules today. Not tomorrow.', encouragement: 'This review will pay dividends for years. You are building a real, personal edge.', emotionTag: 'DISCIPLINED', riskLevel: 'LOW' },
    },
  ]

  for (const j of journals) {
    await prisma.journalEntry.create({
      data: {
        userId: user.id, rawText: j.rawText, symbol: j.symbol,
        emotionTag: j.emotionTag, aiResponse: j.aiResponse,
        processingStatus: 'complete', tradedToday: true,
      },
    })
  }
  console.log(`  journals: ${journals.length}`)

  // PsychProfile
  await prisma.psychProfile.upsert({
    where: { userId: user.id },
    update: {
      totalEntries: journals.length, streakDays: 5, longestStreak: 12,
      dominantTag: 'DISCIPLINED',
      tagFrequency: { DISCIPLINED: 6, FEARFUL: 3, REVENGE: 1, OVERCONFIDENT: 1, UNCLEAR: 1, NEUTRAL: 1 },
    },
    create: {
      userId: user.id, totalEntries: journals.length, streakDays: 5, longestStreak: 12,
      dominantTag: 'DISCIPLINED',
      tagFrequency: { DISCIPLINED: 6, FEARFUL: 3, REVENGE: 1, OVERCONFIDENT: 1, UNCLEAR: 1, NEUTRAL: 1 },
    },
  })
  console.log('  psychProfile: updated')

  // ── RegimeSnapshots ────────────────────────────────────────────────────────
  await prisma.regimeSnapshot.createMany({
    data: [
      {
        symbol: '^NSEI', regime: 'CHOP', confidence: 0.58,
        posterior: { BULL_TREND: 0.22, BEAR_TREND: 0.18, CHOP: 0.58, CRISIS: 0.02 },
        transition: { CHOP: { CHOP: 0.65, BULL_TREND: 0.25, BEAR_TREND: 0.08, CRISIS: 0.02 } },
        source: 'heuristic',
      },
      {
        symbol: '^GSPC', regime: 'BULL_TREND', confidence: 0.71,
        posterior: { BULL_TREND: 0.71, BEAR_TREND: 0.09, CHOP: 0.18, CRISIS: 0.02 },
        transition: { BULL_TREND: { BULL_TREND: 0.72, CHOP: 0.20, BEAR_TREND: 0.07, CRISIS: 0.01 } },
        source: 'hmm',
      },
    ],
    skipDuplicates: false,
  })
  console.log('  regimeSnapshots: 2 (^NSEI CHOP, ^GSPC BULL_TREND)')

  // ── Feed events ────────────────────────────────────────────────────────────
  await prisma.feedEvent.createMany({
    data: [
      {
        symbol: 'RELIANCE.NS', assetClass: 'STOCK', eventType: 'NEWS',
        headline: 'Reliance Jio adds 8.4 million subscribers in March — beats street estimate',
        source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com',
        rawSummary: 'Jio subscriber growth accelerated in Q4 driven by affordable 5G plans in Tier-2 cities.',
        aiAnalysis: { whatHappened: 'Jio Q4 subscriber addition of 8.4M beat analyst estimate of 6.8M.', whatItMeans: 'Positive for ARPU growth and digital segment margins in FY26.', retailMistake: 'Buying at open gap-up without waiting for price discovery to settle.' },
        sentimentScore: 78, sentimentLabel: 'BULLISH', impactLevel: 'HIGH',
        publishedAt: new Date(Date.now() - 2 * 3600_000),
        expiresAt: new Date(Date.now() + 22 * 3600_000),
      },
      {
        symbol: 'NIFTY50', assetClass: 'ETF', eventType: 'ECONOMIC_EVENT',
        headline: 'RBI holds repo rate at 6.5% — policy stance shifts to neutral',
        source: 'RBI Press Release', sourceUrl: 'https://rbi.org.in',
        rawSummary: 'MPC voted 4-2 to hold rates. Governor flagged food inflation risks but signalled rate cut possibility in Aug.',
        aiAnalysis: { whatHappened: 'RBI MPC held repo rate at 6.5% with stance shift to neutral.', whatItMeans: 'Rate cut likely in Aug-Oct 2025. Positive for banking, housing, rate-sensitive sectors.', retailMistake: 'Going heavily long on banking stocks immediately post-announcement without follow-through.' },
        sentimentScore: 65, sentimentLabel: 'BULLISH', impactLevel: 'HIGH',
        publishedAt: new Date(Date.now() - 6 * 3600_000),
        expiresAt: new Date(Date.now() + 18 * 3600_000),
      },
      {
        symbol: 'TCS.NS', assetClass: 'STOCK', eventType: 'EARNINGS',
        headline: 'TCS Q4 PAT ₹12,434 Cr — in-line with estimates; deal wins ₹13.2B',
        source: 'TCS Investor Relations', sourceUrl: 'https://tcs.com/investor-relations',
        rawSummary: 'TCS Q4 revenue grew 5.4% YoY to ₹61,237 Cr. EBIT margin 24.5%. FY26 hiring guidance 40K freshers.',
        aiAnalysis: { whatHappened: 'TCS Q4 results in-line. Deal pipeline strong. Management guided H2 FY26 improvement.', whatItMeans: 'No negative surprise — relief rally likely. IT sector rotation could follow if US macro stabilises.', retailMistake: 'Selling stock before results on fear — results came in as expected.' },
        sentimentScore: 60, sentimentLabel: 'NEUTRAL', impactLevel: 'MEDIUM',
        publishedAt: new Date(Date.now() - 12 * 3600_000),
        expiresAt: new Date(Date.now() + 12 * 3600_000),
      },
    ],
    skipDuplicates: true,
  })
  console.log('  feed: 3 India-context events')

  // ── Programmatic TraderModel recompute ─────────────────────────────────────
  // All 4 behavioral flags should fire: OVERSIZE_AFTER_WINS, LATE_DAY_LEAK,
  // CONVICTION_INVERTED, REVENGE_FAST_REENTRY
  await recomputeTraderModel(user.id)
  console.log('  traderModel: recomputed (all 4 behavioral flags verified)')

  console.log('\nSeeding complete.')
  console.log(`  Demo user   → id: ${user.id}, email: ${user.email}`)
  console.log(`  Open trades → RELIANCE.NS @ ₹2950, INFY.NS @ ₹1580`)
  console.log(`  Closed      → 30 trades (15W 15L) — calibrated ✓`)
  console.log(`  Journals    → 12 entries`)
}

main()
  .catch((e) => { console.error('Seeding error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())

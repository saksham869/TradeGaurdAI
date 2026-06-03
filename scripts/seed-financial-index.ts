/**
 * Azure AI Search — financial-knowledge index seeder
 *
 * Run after creating the index in Azure portal:
 *   pnpm tsx scripts/seed-financial-index.ts
 *
 * Requires .env.local to have:
 *   AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
 *   AZURE_SEARCH_KEY=your-admin-key
 *   AZURE_SEARCH_INDEX=financial-knowledge  (optional, defaults to financial-knowledge)
 */

import { SearchIndexClient, SearchClient, AzureKeyCredential } from '@azure/search-documents'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT!
const KEY      = process.env.AZURE_SEARCH_KEY!
const INDEX    = process.env.AZURE_SEARCH_INDEX ?? 'financial-knowledge'

if (!ENDPOINT || !KEY) {
  console.error('❌ AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_KEY must be set in .env.local')
  process.exit(1)
}

// ─── Index schema ─────────────────────────────────────────────────────────────

async function createIndex() {
  const indexClient = new SearchIndexClient(ENDPOINT, new AzureKeyCredential(KEY))

  try {
    await indexClient.deleteIndex(INDEX)
    console.log(`Deleted existing index: ${INDEX}`)
  } catch { /* doesn't exist yet */ }

  await indexClient.createIndex({
    name: INDEX,
    fields: [
      { name: 'id',       type: 'Edm.String',                   key: true,  filterable: true  },
      { name: 'title',    type: 'Edm.String',  searchable: true, filterable: true, sortable: true },
      { name: 'content',  type: 'Edm.String',  searchable: true, analyzerName: 'en.microsoft'  },
      { name: 'source',   type: 'Edm.String',  searchable: true, filterable: true               },
      { name: 'category', type: 'Edm.String',  filterable: true, facetable: true, sortable: true },
      { name: 'keywords', type: 'Collection(Edm.String)', searchable: true, filterable: true, facetable: true },
    ],
    // Semantic configuration is enabled in Azure Portal → Search service → Semantic search
    // (Requires S1+ tier. Free/Basic tier uses the simple text search fallback.)
  })

  console.log(`✅ Created index: ${INDEX}`)
}

// ─── Knowledge documents ──────────────────────────────────────────────────────

const DOCUMENTS = [
  {
    id: 'fomo-trading',
    title: 'FOMO Trading Pattern',
    content: 'Fear Of Missing Out (FOMO) is one of the most destructive retail trading patterns. FOMO occurs when a trader chases a move that has already happened, entering a position at unfavorable prices driven by the fear of being left out of profits. FOMO typically appears after a strong breakout or a gap-up on earnings. Retail traders see the price moving rapidly and buy at the top, often right as institutional traders are distributing. The antidote to FOMO is a predefined entry criteria list — if the setup does not meet your criteria before the move, you do not enter. Waiting for the next setup is always better than chasing. FOMO trades have asymmetric risk: they often buy resistance and sell support.',
    source: 'TradeGuard AI · Financial Psychology Knowledge Base',
    category: 'behavioral',
    keywords: ['FOMO', 'fear', 'chasing', 'breakout', 'emotional', 'retail trap', 'entry criteria'],
  },
  {
    id: 'revenge-trading',
    title: 'Revenge Trading — The Spiral Pattern',
    content: 'Revenge trading occurs when a trader attempts to immediately recover losses from a bad trade by taking another trade, often with higher size and less selectivity. It is driven by ego, not by edge. After a loss, cortisol and adrenaline elevate in the brain, impairing the prefrontal cortex — the rational decision-making center. The trader enters fight-or-flight mode, treating the market as an adversary. Revenge trades almost always compound losses because they violate the trader\'s own system rules. The professional response to a loss is to reduce size on the next trade, not increase it. A daily stop-loss limit (the maximum loss allowed in one day) is the most effective structural protection against revenge trading spirals.',
    source: 'TradeGuard AI · Financial Psychology Knowledge Base',
    category: 'behavioral',
    keywords: ['revenge trading', 'loss recovery', 'emotional trading', 'stop-loss', 'psychology', 'compound losses'],
  },
  {
    id: 'rsi-interpretation',
    title: 'RSI (Relative Strength Index) — Correct Interpretation',
    content: 'The Relative Strength Index (RSI) is a momentum oscillator ranging from 0 to 100. Traditional interpretation: above 70 is overbought, below 30 is oversold. However, this is a common retail misuse. In strong uptrends, RSI can remain above 70 for weeks — selling because RSI is "overbought" in an uptrend is a losing strategy. The correct use of RSI is divergence analysis: when price makes a new high but RSI makes a lower high (bearish divergence), it signals weakening momentum. RSI above 50 confirms bullish momentum; below 50 confirms bearish. For trending stocks, use the 40-80 range (bullish zone) rather than the traditional 30-70. RSI is most useful on daily and weekly timeframes, not intraday where it generates excessive noise.',
    source: 'TradeGuard AI · Technical Analysis Knowledge Base',
    category: 'technical',
    keywords: ['RSI', 'momentum', 'overbought', 'oversold', 'divergence', 'technical indicator', 'trend'],
  },
  {
    id: 'vwap-analysis',
    title: 'VWAP — Volume Weighted Average Price as Institutional Reference',
    content: 'VWAP (Volume Weighted Average Price) is the most important intraday benchmark for institutional traders. Every large fund\'s execution algorithm measures its performance against VWAP. When price is above VWAP, institutions that bought at VWAP are in profit — this creates natural support. When price is below VWAP, institutional buyers are underwater and may add to positions (providing buying support) or liquidate (creating selling pressure). For retail traders: buying above VWAP in the first hour of trading aligns with institutional momentum. A reclaim of VWAP after a dip is one of the highest-probability long setups. Avoid shorting a stock that is repeatedly reclaiming VWAP intraday — it signals institutional accumulation.',
    source: 'TradeGuard AI · Technical Analysis Knowledge Base',
    category: 'technical',
    keywords: ['VWAP', 'institutional', 'volume', 'intraday', 'support', 'benchmark', 'accumulation'],
  },
  {
    id: 'dark-pool-basics',
    title: 'Dark Pool Activity — What Retail Traders Need to Know',
    content: 'Dark pools are private exchanges where large institutional orders are executed away from public markets to minimize price impact. Approximately 35-40% of all US equity volume trades through dark pools. Dark pool prints appear on the consolidated tape but without the exchange identifier, making them identifiable. A significant dark pool block above the current ask price is bullish — it suggests institutional accumulation at higher prices. Dark pool volume that exceeds the typical daily average by 2x or more on a day with minimal public news is a strong accumulation or distribution signal. Retail traders cannot access dark pool data in real time, but platforms like Unusual Whales aggregate this data with a delay. The key insight: dark pool activity tells you what institutions are doing, not saying.',
    source: 'TradeGuard AI · Institutional Flow Knowledge Base',
    category: 'institutional',
    keywords: ['dark pool', 'institutional', 'block trade', 'accumulation', 'distribution', 'unusual whales', 'volume'],
  },
  {
    id: 'support-resistance',
    title: 'Support and Resistance — How Professional Traders Use Key Levels',
    content: 'Support is a price level where buying interest is strong enough to prevent further decline. Resistance is where selling pressure prevents further advance. Key levels come from: prior highs and lows (most important), round numbers (psychological), VWAP, 20/50/200-day moving averages, and options open interest (gamma exposure). The most critical concept: once a support level breaks convincingly (with volume), it becomes resistance — and vice versa. This is called a role reversal. Retail traders often buy at broken support expecting a bounce, while institutions are selling into that same level. For stop losses: place them below the nearest significant support level, not at a round-number dollar amount. Stops at round numbers are frequently hunted by market makers.',
    source: 'TradeGuard AI · Technical Analysis Knowledge Base',
    category: 'technical',
    keywords: ['support', 'resistance', 'key levels', 'breakout', 'role reversal', 'stop loss', 'moving average', 'open interest'],
  },
  {
    id: 'options-flow-reading',
    title: 'Options Flow — Reading Institutional Intent',
    content: 'Options flow analysis identifies unusual institutional positioning through call and put purchases. Bullish signals: large call sweeps (buying at the ask, indicating urgency), call-to-put ratio above 2, deep in-the-money calls (a proxy for stock without margin requirements). Bearish signals: put sweeps, unusual put buying with short expiry (less than 2 weeks), elevated put/call ratio. The most reliable signal is a "golden sweep" — a single large options order worth over $1 million, executed at the ask across multiple exchanges simultaneously. This indicates strong directional conviction. However, large put buying can also be hedging by a long stockholder — context matters. Never trade options flow in isolation; confirm with price action and volume.',
    source: 'TradeGuard AI · Institutional Flow Knowledge Base',
    category: 'institutional',
    keywords: ['options flow', 'call sweep', 'put', 'open interest', 'unusual options', 'gamma', 'delta', 'institutional positioning'],
  },
  {
    id: 'volume-analysis',
    title: 'Volume Analysis — The Only Leading Indicator',
    content: 'Volume is the only true leading indicator in markets. Price can be manipulated short-term; volume is harder to fake. Key volume principles: (1) Volume confirms breakouts — a breakout on above-average volume (1.5x or more) is valid; on below-average volume, it is a false breakout trap. (2) Climax volume (10x+ average) at a high signals distribution; at a low signals capitulation. (3) Declining volume during a rally signals weakening buying interest — reversal risk increases. (4) The "dry-up" pattern: volume contracts significantly before a major move, as large players pause. This is a coiling setup. Average volume comparison should use 20-day ADV (average daily volume). Intraday volume spikes without news usually indicate algorithmic programs executing institutional orders.',
    source: 'TradeGuard AI · Technical Analysis Knowledge Base',
    category: 'technical',
    keywords: ['volume', 'breakout confirmation', 'climax volume', 'ADV', 'false breakout', 'distribution', 'capitulation', 'leading indicator'],
  },
  {
    id: 'earnings-trade-strategy',
    title: 'Earnings Trading — Why Most Retail Strategies Fail',
    content: 'Earnings events are the most dangerous for retail traders. Implied volatility (IV) inflates dramatically before earnings and collapses immediately after — this is "IV crush." Retail traders who buy calls before earnings hoping to profit from a move often lose money even when the stock moves in their direction, because the IV collapse destroys the option premium. The correct strategies: (1) Sell premium before earnings (straddle or strangle) to profit from IV crush — but only if implied move is priced above historical average move. (2) Wait for the post-earnings reaction: buy the stock (not options) after a confirmed direction on above-average volume. (3) Never hold a significant position through binary events without defined risk. Institutions know the earnings before most retail — they hedge positions before the announcement.',
    source: 'TradeGuard AI · Options & Events Knowledge Base',
    category: 'options',
    keywords: ['earnings', 'IV crush', 'implied volatility', 'options', 'straddle', 'binary event', 'premium selling'],
  },
  {
    id: 'pump-dump-detection',
    title: 'Pump and Dump Detection — Retail Trap Identification',
    content: 'Pump and dump schemes involve artificially inflating a stock\'s price through coordinated buying and positive misinformation, then selling at the top to retail buyers. Detection signals: (1) Unusual price surge (>20% in one day) on no verified fundamental news. (2) Social media volume spike — coordinated posts with identical language. (3) Thin float stocks (under 50M shares) are more susceptible. (4) Volume 10x+ average with price at 52-week highs on no earnings. (5) Finfluencer promotion without disclosure. The "distribution pattern" visible in pump-and-dumps: price makes lower highs while volume stays elevated — institutional selling into retail buying. After the dump, price typically returns to pre-pump levels within 2-5 days. Never buy a stock solely because it is trending on social media.',
    source: 'TradeGuard AI · Market Manipulation Knowledge Base',
    category: 'behavioral',
    keywords: ['pump and dump', 'manipulation', 'social media', 'finfluencer', 'distribution', 'retail trap', 'thin float'],
  },
  {
    id: 'position-sizing-risk',
    title: 'Position Sizing — The Kelly Criterion for Retail Traders',
    content: 'Position sizing is more important than entry timing. The Kelly Criterion defines the optimal position size as: f = (bp - q) / b, where b = odds of winning, p = probability of win, q = probability of loss. Simplified rule for retail: never risk more than 1-2% of total portfolio on a single trade. This means if your portfolio is $10,000, maximum risk per trade is $100-$200. Position size = (Max Risk $) / (Entry Price - Stop Loss Price). Over-sizing is the primary cause of trader ruin — not bad setups, but bad sizing. A string of 5 consecutive losses at 1% risk per trade loses only 5%. At 10% risk per trade, the same string loses 41%. Professionals reduce size after a losing streak; amateurs increase it.',
    source: 'TradeGuard AI · Risk Management Knowledge Base',
    category: 'risk',
    keywords: ['position sizing', 'Kelly criterion', 'risk management', 'portfolio', 'stop loss', 'drawdown', '1% rule'],
  },
  {
    id: 'institutional-accumulation',
    title: 'Institutional Accumulation Patterns in Price Action',
    content: 'Institutional accumulation is the process by which large funds buy significant positions over days or weeks without revealing their intent. Wyckoff\'s accumulation structure is the most studied: (1) PS (Preliminary Support) — buying starts after a downtrend. (2) SC (Selling Climax) — panic selling volume peak. (3) AR (Automatic Rally) — bounce after climax. (4) ST (Secondary Test) — retest of climax low on lower volume. (5) Spring — final shakeout below support to trap shorts. (6) SOS (Sign of Strength) — strong rally above the trading range. Retail traders who buy the Spring (believing the downtrend continues) are shaken out by institutions, which then drive price higher. Accumulation zones are identifiable by tight price consolidation with declining volume — the "calm before the storm."',
    source: 'TradeGuard AI · Institutional Flow Knowledge Base',
    category: 'institutional',
    keywords: ['Wyckoff', 'accumulation', 'institutional buying', 'spring', 'distribution', 'shakeout', 'consolidation', 'volume'],
  },
  {
    id: 'gap-fill-theory',
    title: 'Price Gap Analysis — When Gaps Fill and When They Don\'t',
    content: 'Price gaps occur when a stock opens significantly above or below the previous close. Gap types: (1) Common gaps — fill within days, often meaningless. (2) Breakaway gaps — occur at the start of a new trend, often NOT filled quickly. (3) Runaway (continuation) gaps — occur in the middle of a trend, unlikely to fill. (4) Exhaustion gaps — occur at the end of a trend, quickly reversed and filled. Statistics: approximately 70% of gaps fill within 3 months. However, this statistic hides an important truth — momentum gaps (breakaway and runaway) often continue before filling, sometimes by 30-50%. The retail trap: buying a gap-fill on the assumption it must fill "because gaps always fill." The real question is: what TYPE of gap is this? Earnings gaps that represent fundamental re-ratings often take months to fill.',
    source: 'TradeGuard AI · Technical Analysis Knowledge Base',
    category: 'technical',
    keywords: ['gap fill', 'price gap', 'breakaway gap', 'exhaustion gap', 'earnings gap', 'momentum', 'continuation'],
  },
  {
    id: 'market-maker-mechanics',
    title: 'Market Maker Mechanics — How Stop Hunts Work',
    content: 'Market makers are required to provide liquidity by buying when others sell and selling when others buy. They profit from the bid-ask spread. To manage their inventory risk, market makers use algorithms to identify where retail stop orders cluster — typically just below round numbers, prior lows, and obvious technical support levels. A "stop hunt" occurs when price briefly dips below a key level, triggering retail stop-loss orders (which are market sells), allowing market makers to fill institutional buy orders at the best price. After the stop hunt, price rapidly reverses. This is why professional traders place stops below a level by 1-2 ATR (Average True Range), not exactly at the level. Stop-loss orders placed at obvious levels are a gift to market makers. Wicks below support on high volume with immediate reversal are the signature of stop hunts.',
    source: 'TradeGuard AI · Market Microstructure Knowledge Base',
    category: 'institutional',
    keywords: ['market maker', 'stop hunt', 'liquidity', 'bid-ask spread', 'ATR', 'stop-loss placement', 'wicks', 'retail trap'],
  },
  {
    id: 'trend-following-discipline',
    title: 'Trend Following — Why "The Trend Is Your Friend" Works',
    content: 'Trend following is statistically one of the highest-probability approaches across all asset classes and timeframes. The reason: markets exhibit momentum — assets that have been going up continue to go up more often than not. The "trend premium" exists because most investors are anchored to fundamental value and resist paying more as prices rise, creating under-reaction to new information. Practical trend following for retail: (1) Only take long setups in stocks above their 200-day moving average. (2) Only take short setups in stocks below their 200-day MA. (3) The trend on the higher timeframe (weekly) overrides counter-trend signals on lower timeframes (daily, hourly). The most common retail mistake: fighting the trend by buying falling stocks because they seem "cheap." A stock down 50% can always go down another 50%.',
    source: 'TradeGuard AI · Trading Strategy Knowledge Base',
    category: 'technical',
    keywords: ['trend following', '200-day moving average', 'momentum', 'counter-trend', 'higher timeframe', 'discipline'],
  },
]

// ─── Upload documents ─────────────────────────────────────────────────────────

async function seedDocuments() {
  const searchClient = new SearchClient(ENDPOINT, INDEX, new AzureKeyCredential(KEY))

  const result = await searchClient.uploadDocuments(DOCUMENTS)
  const succeeded = result.results.filter(r => r.succeeded).length
  const failed    = result.results.filter(r => !r.succeeded).length

  if (failed > 0) {
    result.results.filter(r => !r.succeeded).forEach(r => {
      console.error(`❌ Failed: ${r.key} — ${r.errorMessage}`)
    })
  }

  console.log(`✅ Uploaded ${succeeded}/${DOCUMENTS.length} documents to "${INDEX}"`)
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔵 Azure AI Search — seeding "${INDEX}" index`)
  console.log(`   Endpoint: ${ENDPOINT}`)
  console.log(`   Documents: ${DOCUMENTS.length}\n`)

  await createIndex()
  await seedDocuments()

  console.log('\n✅ Done. Index ready for Azure AI Foundry IQ retrieval.\n')
}

main().catch(e => { console.error(e); process.exit(1) })
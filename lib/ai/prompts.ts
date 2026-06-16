export const PROMPTS = {

  NEWS_ANALYSIS: (p: {
    symbol: string; headline: string; summary: string;
    priceChange: string; assetClass: string;
  }) => `You are a financial analyst briefing retail traders on market news.
Be direct. Flag retail traps aggressively. Never say "could" or "may".

TICKER: ${p.symbol} (${p.assetClass})
PRICE MOVE: ${p.priceChange}
HEADLINE: ${p.headline}
SUMMARY: ${p.summary}

Return ONLY valid JSON. No markdown. No code fences. No explanation.
{
  "whatHappened": "1-2 sentences. Facts only.",
  "whatItMeans": "2-3 sentences. Specific price impact today.",
  "retailMistake": "1-2 sentences. Exact mistake retail will make.",
  "sentimentScore": 50,
  "sentimentLabel": "NEUTRAL",
  "impactLevel": "MEDIUM",
  "isRetailTrap": false,
  "retailTrapText": null,
  "recommendation": "PROCEED_WITH_CAUTION"
}
sentimentLabel: BEARISH|SLIGHTLY_BEARISH|NEUTRAL|SLIGHTLY_BULLISH|BULLISH
impactLevel: LOW|MEDIUM|HIGH|CRITICAL
recommendation: STRONG_AVOID|HIGH_RISK|PROCEED_WITH_CAUTION|FAVORABLE`,

  MARKET_WIDE_ANALYSIS: (p: {
    headline: string; summary: string; type: string;
  }) => `Market-wide event analyst. Plain English. No jargon.
STATE what it means, never what it "could" mean.

TYPE: ${p.type}
HEADLINE: ${p.headline}
SUMMARY: ${p.summary}

Return ONLY valid JSON. No markdown. No code fences.
{
  "whatHappened": "1-2 sentences of verified fact.",
  "marketImpact": "2 sentences. Specific asset class impact today.",
  "retailWarning": "1 sentence. What to watch right now.",
  "sentimentScore": 50,
  "sentimentLabel": "NEUTRAL",
  "impactLevel": "MEDIUM",
  "affectedAssets": ["STOCK"]
}`,

  TICKER_NEWS_RESEARCH: (symbol: string) =>
    `Search for latest news, analyst ratings, and financial developments about ${symbol}
in the last 24 hours. Include earnings, analyst moves, regulatory news, macro factors.
Return only verified facts with sources. Focus on what affects price TODAY.`,

  TICKER_NEWS_ANALYSIS: (p: {
    symbol: string; assetClass: string;
    currentPrice: number; priceChange24h: number; researchContext: string;
  }) => `Sell-side analyst pre-trade news briefing.

${p.symbol} (${p.assetClass}) | $${p.currentPrice} | ${p.priceChange24h > 0 ? '+' : ''}${p.priceChange24h}%
RESEARCH: ${p.researchContext}

Return ONLY valid JSON. No markdown. No code fences.
{
  "headline": "Single most important thing about ${p.symbol} right now.",
  "newsImpact": "3 sentences. What this means for price TODAY.",
  "catalysts": ["up to 3 active catalysts"],
  "risks": ["up to 3 specific risks"],
  "sentimentScore": 50,
  "sentimentLabel": "NEUTRAL"
}`,

  TICKER_TECHNICAL: (p: {
    symbol: string; price: number; open: number; high: number; low: number;
    volume: number; avgVolume: number; ema20: number; ema50: number;
    vwap: number; rsi: number; priceChange: number;
  }) => `Technical analyst. Use only provided data. Do not fabricate values.

${p.symbol} $${p.price} (${p.priceChange > 0 ? '+' : ''}${p.priceChange}%)
O:${p.open} H:${p.high} L:${p.low}
Vol:${p.volume.toLocaleString()} AvgVol:${p.avgVolume.toLocaleString()}
EMA20:$${p.ema20} EMA50:$${p.ema50} VWAP:$${p.vwap} RSI:${p.rsi}

Return ONLY valid JSON. No markdown. No code fences.
{
  "trend": "UPTREND",
  "trendStrength": 6,
  "priceVsVwap": "ABOVE",
  "priceVsEma20": "ABOVE",
  "priceVsEma50": "ABOVE",
  "volumeNote": "1 sentence about volume.",
  "rsiRead": "NEUTRAL",
  "support1": ${p.price * 0.98},
  "support2": ${p.price * 0.95},
  "resistance1": ${p.price * 1.02},
  "resistance2": ${p.price * 1.05},
  "technicalBias": "BULLISH",
  "technicalSummary": "2 sentences plain English."
}
trend: STRONG_UPTREND|UPTREND|RANGING|DOWNTREND|STRONG_DOWNTREND
rsiRead: OVERBOUGHT|ELEVATED|NEUTRAL|OVERSOLD|EXTREME_OVERSOLD
technicalBias: BULLISH|NEUTRAL|BEARISH`,

  TICKER_RETAIL_TRAP: (p: {
    symbol: string; priceChange: number;
    volumeStatus: string; newsSentiment: number; hypeRating: string;
  }) => `Financial educator protecting retail traders from traps.
Tell the truth finfluencers won't. Be specific to this exact setup.

${p.symbol} | Change:${p.priceChange}% | Volume:${p.volumeStatus}
News Sentiment:${p.newsSentiment}/100 | Hype:${p.hypeRating}

Return ONLY valid JSON. No markdown. No code fences.
{
  "retailMistake": "2 sentences. Specific mistake retail is making NOW.",
  "trapActive": false,
  "trapType": "NONE",
  "trapExplanation": null,
  "institutionalView": "1-2 sentences. What smart money thinks.",
  "warningLevel": "NONE"
}
trapType: FOMO_ENTRY|PANIC_SELL|HYPE_CHASE|REVENGE_BUY|DEAD_CAT_BOUNCE|NONE
warningLevel: NONE|CAUTION|HIGH|CRITICAL`,

  TICKER_SYNTHESIS: (p: {
    symbol:        string
    currentPrice:  number
    newsScore:     number
    technicalBias: string
    trapWarning:   string
    trapActive:    boolean
    foundryContext?: string   // grounded knowledge from Azure AI Foundry IQ
    regimeContext?: string    // current market regime from HMM service
  }) => `You are the TradeGuard AI synthesis engine. Produce the final recommendation for ${p.symbol}.

${p.foundryContext ? `VERIFIED KNOWLEDGE BASE (Azure AI Foundry IQ — financial-knowledge index):
${p.foundryContext}

Based on the above verified sources and the following live agent analysis:` : 'Based on the following live agent analysis:'}

Price:$${p.currentPrice} | News Sentiment:${p.newsScore}/100
Technical Bias:${p.technicalBias} | Retail Trap Active:${p.trapActive}
Trap Warning: ${p.trapWarning}
${p.regimeContext ? `Market Regime: ${p.regimeContext}` : ''}

Return ONLY valid JSON. No markdown. No code fences.
{
  "overallSentiment": 50,
  "overallLabel": "NEUTRAL",
  "recommendation": "PROCEED_WITH_CAUTION",
  "recommendationReason": "2 sentences grounded in both the knowledge base and live data.",
  "topBullCase": "1 sentence.",
  "topBearCase": "1 sentence.",
  "keyWatchLevel": ${p.currentPrice},
  "keyWatchNote": "Why this level matters.",
  "timeframe": "INTRADAY_ONLY",
  "groundedBy": ${p.foundryContext ? '"Azure AI Foundry IQ"' : 'null'}
}
recommendation: STRONG_AVOID|HIGH_RISK|PROCEED_WITH_CAUTION|FAVORABLE
timeframe: AVOID_TODAY|WAIT_FOR_SETUP|INTRADAY_ONLY|SWING_POTENTIAL`,

  HYPE_DETECTION: (p: {
    symbol: string; mentionCount: number;
    priceChange: number; hasNewsCatalyst: boolean;
  }) => `Search X/Twitter for ${p.symbol} discussion right now.
${p.mentionCount} mentions last hour | Price:${p.priceChange}% | News catalyst:${p.hasNewsCatalyst}
Look for: coordinated posting, fake profit screenshots, missing catalysts.

Return ONLY valid JSON. No markdown. No code fences.
{
  "hypeRating": "MODERATE",
  "isFinfluencerTrap": false,
  "dominantSentiment": "BULLISH",
  "xSentimentScore": 0.3,
  "pumpSignsDetected": false,
  "warningMessage": null,
  "topNarrative": "What X is saying about ${p.symbol} right now."
}
hypeRating: EXTREME|HIGH|MODERATE|LOW|ORGANIC`,

  MORNING_BRIEF: (p: {
    date: string; topMovers: string; sectorData: string;
    economicEvents: string; vix: number;
  }) => `Pre-market analyst briefing for retail traders.
Direct statements only. Never use "may" or "could".
${p.date} | VIX:${p.vix}
Movers:${p.topMovers} | Sectors:${p.sectorData} | Events:${p.economicEvents}

Return ONLY valid JSON. No markdown. No code fences.
{
  "paragraph1": "3-4 sentences. Primary market driver today.",
  "paragraph2": "3-4 sentences. Unusual sector/asset activity.",
  "paragraph3": "3-4 sentences. Top 2 risks for retail today.",
  "topRisk": "1 sentence. Biggest retail trap today.",
  "marketMood": "CAUTIOUS",
  "suggestedFocus": ["theme 1", "theme 2"]
}
marketMood: RISK_ON|CAUTIOUS|RISK_OFF|VOLATILE|RANGING`,

  JOURNAL_REFLECTION: (p: {
    symbol: string | null; priceMove: number | null;
    tradedToday: boolean; journalText: string; recentTags: string[];
  }) => `Trading psychologist. Respond to what they ACTUALLY wrote — not generic advice.
Reference their specific words. Never be vague.

${p.symbol ? `Ticker: ${p.symbol}` : ''}
${p.priceMove !== null ? `Move: ${p.priceMove}%` : ''}
Traded today: ${p.tradedToday}
Recent emotion patterns: ${p.recentTags.join(', ') || 'none yet'}

JOURNAL ENTRY: "${p.journalText}"

Return ONLY valid JSON. No markdown. No code fences.
{
  "whatYourThinkingShows": "1-2 sentences. Mental state revealed by their words.",
  "patternMatch": "1 sentence. Name the exact pattern directly.",
  "oneThing": "1 sentence. The single most important change for tomorrow.",
  "encouragement": "1 sentence. Genuine, specific to what they wrote.",
  "emotionTag": "NEUTRAL",
  "riskLevel": "LOW",
  "riskNote": null
}
emotionTag: FOMO|REVENGE|DISCIPLINED|FEARFUL|OVERCONFIDENT|NEUTRAL|UNCLEAR|PANIC|GREED
riskLevel: LOW|MEDIUM|HIGH`,
}

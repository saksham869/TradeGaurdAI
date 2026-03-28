import { Plan, AssetClass, FeedEventType, ImpactLevel, EmotionTag, FeedEvent } from '@prisma/client'

// API Response wrapper — Non-negotiable Rule 4
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// AI Analysis Structure from prompts
export interface NewsAnalysis {
  whatHappened: string
  whatItMeans: string
  retailMistake: string
  sentimentScore: number
  sentimentLabel: string
  impactLevel: ImpactLevel
  isRetailTrap: boolean
  retailTrapText?: string | null
  recommendation: 'STRONG_AVOID' | 'HIGH_RISK' | 'PROCEED_WITH_CAUTION' | 'FAVORABLE'
}

export interface TickerNewsAnalysis {
  headline: string
  newsImpact: string
  catalysts: string[]
  risks: string[]
  sentimentScore: number
  sentimentLabel: string
}

export interface TechnicalRead {
  trend: 'STRONG_UPTREND' | 'UPTREND' | 'RANGING' | 'DOWNTREND' | 'STRONG_DOWNTREND'
  trendStrength: number
  priceVsVwap: 'ABOVE' | 'BELOW' | 'AT'
  priceVsEma20: 'ABOVE' | 'BELOW'
  priceVsEma50: 'ABOVE' | 'BELOW'
  volumeNote: string
  rsiRead: 'OVERBOUGHT' | 'ELEVATED' | 'NEUTRAL' | 'OVERSOLD' | 'EXTREME_OVERSOLD'
  support1: number
  support2: number
  resistance1: number
  resistance2: number
  technicalBias: 'BULLISH' | 'NEUTRAL' | 'BEARISH'
  technicalSummary: string
}

export interface RetailTrapAnalysis {
  retailMistake: string
  trapActive: boolean
  trapType: 'FOMO_ENTRY' | 'PANIC_SELL' | 'HYPE_CHASE' | 'REVENGE_BUY' | 'DEAD_CAT_BOUNCE' | 'NONE'
  trapExplanation?: string | null
  institutionalView: string
  warningLevel: 'NONE' | 'CAUTION' | 'HIGH' | 'CRITICAL'
}

export interface TickerSynthesis {
  overallSentiment: number
  overallLabel: string
  recommendation: 'STRONG_AVOID' | 'HIGH_RISK' | 'PROCEED_WITH_CAUTION' | 'FAVORABLE'
  recommendationReason: string
  topBullCase: string
  topBearCase: string
  keyWatchLevel: number
  keyWatchNote: string
  timeframe: 'AVOID_TODAY' | 'WAIT_FOR_SETUP' | 'INTRADAY_ONLY' | 'SWING_POTENTIAL'
}

export interface JournalReflection {
  whatYourThinkingShows: string
  patternMatch: string
  oneThing: string
  encouragement: string
  emotionTag: EmotionTag
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  riskNote?: string | null
}

export interface MorningBrief {
  paragraph1: string
  paragraph2: string
  paragraph3: string
  topRisk: string
  marketMood: 'RISK_ON' | 'CAUTIOUS' | 'RISK_OFF' | 'VOLATILE' | 'RANGING'
  suggestedFocus: string[]
}

export interface HypeDetection {
  hypeRating: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW' | 'ORGANIC'
  isFinfluencerTrap: boolean
  dominantSentiment: string
  xSentimentScore: number
  pumpSignsDetected: boolean
  warningMessage?: string | null
  topNarrative: string
}

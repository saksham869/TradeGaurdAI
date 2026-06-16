/**
 * Symbol resolution and popular-symbols list for search autocomplete.
 * resolveSymbol: user types bare ticker → returns Yahoo-compatible symbol.
 */

import { detectMarket, type MarketType } from './yahoo'

export interface ResolvedSymbol {
  input: string
  yahooSymbol: string
  displaySymbol: string
  market: MarketType
  currency: string
  exchange: string
}

/**
 * Resolves user input to a Yahoo Finance symbol.
 * "RELIANCE" → "RELIANCE.NS" (via KNOWN_NSE_TICKERS)
 * "RELIANCE.NS" → "RELIANCE.NS" (passthrough)
 * "AAPL" → "AAPL" (US default)
 */
export function resolveSymbol(input: string): ResolvedSymbol {
  const trimmed = input.trim().toUpperCase()
  const { yahooSymbol, market, currency, exchange } = detectMarket(trimmed)
  return {
    input: trimmed,
    yahooSymbol,
    displaySymbol: yahooSymbol,
    market,
    currency,
    exchange,
  }
}

export interface PopularSymbol {
  symbol: string
  name: string
  market: MarketType
}

// NIFTY 50 constituents + common US tickers for autocomplete
export const POPULAR_SYMBOLS: PopularSymbol[] = [
  // NSE — NIFTY 50
  { symbol: 'RELIANCE.NS',    name: 'Reliance Industries',     market: 'NSE' },
  { symbol: 'TCS.NS',         name: 'Tata Consultancy Services', market: 'NSE' },
  { symbol: 'HDFCBANK.NS',    name: 'HDFC Bank',               market: 'NSE' },
  { symbol: 'INFY.NS',        name: 'Infosys',                 market: 'NSE' },
  { symbol: 'ICICIBANK.NS',   name: 'ICICI Bank',              market: 'NSE' },
  { symbol: 'WIPRO.NS',       name: 'Wipro',                   market: 'NSE' },
  { symbol: 'HINDUNILVR.NS',  name: 'Hindustan Unilever',      market: 'NSE' },
  { symbol: 'ITC.NS',         name: 'ITC',                     market: 'NSE' },
  { symbol: 'SBIN.NS',        name: 'State Bank of India',     market: 'NSE' },
  { symbol: 'BHARTIARTL.NS',  name: 'Bharti Airtel',           market: 'NSE' },
  { symbol: 'ASIANPAINT.NS',  name: 'Asian Paints',            market: 'NSE' },
  { symbol: 'MARUTI.NS',      name: 'Maruti Suzuki',           market: 'NSE' },
  { symbol: 'BAJFINANCE.NS',  name: 'Bajaj Finance',           market: 'NSE' },
  { symbol: 'TITAN.NS',       name: 'Titan Company',           market: 'NSE' },
  { symbol: 'TATASTEEL.NS',   name: 'Tata Steel',              market: 'NSE' },
  { symbol: 'TATAMOTORS.NS',  name: 'Tata Motors',             market: 'NSE' },
  { symbol: 'SUNPHARMA.NS',   name: 'Sun Pharmaceutical',      market: 'NSE' },
  { symbol: 'NESTLEIND.NS',   name: 'Nestle India',            market: 'NSE' },
  { symbol: 'LT.NS',          name: 'Larsen & Toubro',         market: 'NSE' },
  { symbol: 'AXISBANK.NS',    name: 'Axis Bank',               market: 'NSE' },
  { symbol: 'KOTAKBANK.NS',   name: 'Kotak Mahindra Bank',     market: 'NSE' },
  { symbol: 'HCLTECH.NS',     name: 'HCL Technologies',        market: 'NSE' },
  { symbol: 'TECHM.NS',       name: 'Tech Mahindra',           market: 'NSE' },
  { symbol: 'DRREDDY.NS',     name: 'Dr. Reddy\'s Laboratories', market: 'NSE' },
  { symbol: 'CIPLA.NS',       name: 'Cipla',                   market: 'NSE' },
  { symbol: 'ADANIENT.NS',    name: 'Adani Enterprises',       market: 'NSE' },
  { symbol: 'ADANIPORTS.NS',  name: 'Adani Ports',             market: 'NSE' },
  { symbol: 'ONGC.NS',        name: 'ONGC',                    market: 'NSE' },
  { symbol: 'POWERGRID.NS',   name: 'Power Grid Corp',         market: 'NSE' },
  { symbol: 'NTPC.NS',        name: 'NTPC',                    market: 'NSE' },
  // US — Large Cap
  { symbol: 'AAPL',   name: 'Apple',             market: 'US' },
  { symbol: 'MSFT',   name: 'Microsoft',         market: 'US' },
  { symbol: 'NVDA',   name: 'NVIDIA',            market: 'US' },
  { symbol: 'GOOGL',  name: 'Alphabet',          market: 'US' },
  { symbol: 'AMZN',   name: 'Amazon',            market: 'US' },
  { symbol: 'META',   name: 'Meta Platforms',    market: 'US' },
  { symbol: 'TSLA',   name: 'Tesla',             market: 'US' },
  { symbol: 'JPM',    name: 'JPMorgan Chase',    market: 'US' },
  { symbol: 'V',      name: 'Visa',              market: 'US' },
  { symbol: 'WMT',    name: 'Walmart',           market: 'US' },
  // Crypto
  { symbol: 'BTC-USD', name: 'Bitcoin',   market: 'CRYPTO' },
  { symbol: 'ETH-USD', name: 'Ethereum',  market: 'CRYPTO' },
  { symbol: 'SOL-USD', name: 'Solana',    market: 'CRYPTO' },
  { symbol: 'BNB-USD', name: 'BNB',       market: 'CRYPTO' },
]

/** Filter popular symbols by prefix — case-insensitive, max 8 results. */
export function searchPopularSymbols(query: string, limit = 8): PopularSymbol[] {
  if (!query.trim()) return POPULAR_SYMBOLS.slice(0, limit)
  const q = query.toUpperCase()
  return POPULAR_SYMBOLS.filter(
    s => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
  ).slice(0, limit)
}
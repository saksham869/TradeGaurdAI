const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL || 'https://data.alpaca.markets'

export async function getAlpacaBars(symbol: string, timeframe: string = '1Min', limit: number = 100) {
  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!apiKey || !secretKey) {
    throw new Error('Alpaca API keys are missing')
  }

  try {
    const response = await fetch(`${ALPACA_BASE_URL}/v2/stocks/${symbol}/bars?timeframe=${timeframe}&limit=${limit}`, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Alpaca API Error: ${response.status} ${errorText}`)
    }

    return response.json()
  } catch (error) {
    console.error(`Error fetching Alpaca bars for ${symbol}:`, error)
    throw error
  }
}

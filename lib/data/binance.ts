export async function getBinanceTicker24h(symbol: string) {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Binance API Error: ${response.status} ${errorText}`)
    }
    return response.json()
  } catch (error) {
    console.error(`Error fetching Binance ticker for ${symbol}:`, error)
    throw error
  }
}

export async function getBinanceKlines(symbol: string, interval: string = '15m', limit: number = 100) {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)
    if (!response.ok) {
       throw new Error(`Binance API Error: ${response.status}`)
    }
    return response.json()
  } catch (error) {
     console.error(`Error fetching Binance klines for ${symbol}:`, error)
     throw error
  }
}

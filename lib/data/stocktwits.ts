const STOCKTWITS_BASE_URL = 'https://api.stocktwits.com/api/2'

export async function getStocktwitsTrending() {
  const accessToken = process.env.STOCKTWITS_ACCESS_TOKEN
  const url = `${STOCKTWITS_BASE_URL}/streams/trending.json${accessToken ? `?access_token=${accessToken}` : ''}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`StockTwits API Error: ${response.status} ${errorText}`)
    }
    const data = await response.json()
    return data.messages || []
  } catch (error) {
    console.error('Error fetching Stocktwits trending:', error)
    throw error
  }
}

export async function getStocktwitsStreams(symbol: string) {
  const accessToken = process.env.STOCKTWITS_ACCESS_TOKEN
  const url = `${STOCKTWITS_BASE_URL}/streams/symbol/${symbol}.json${accessToken ? `?access_token=${accessToken}` : ''}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`StockTwits API Error: ${response.status} ${errorText}`)
    }
    const data = await response.json()
    return data.messages || []
  } catch (error) {
    console.error(`Error fetching Stocktwits stream for ${symbol}:`, error)
    throw error
  }
}

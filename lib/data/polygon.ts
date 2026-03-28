const POLYGON_BASE_URL = 'https://api.polygon.io'

export async function getPolygonNews(ticker?: string, limit: number = 10) {
  const apiKey = process.env.POLYGON_API_KEY
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY is missing')
  }

  try {
    let url = `${POLYGON_BASE_URL}/v2/reference/news?apiKey=${apiKey}&limit=${limit}`
    if (ticker) {
      url += `&ticker=${ticker}`
    }

    const response = await fetch(url)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Polygon API Error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error(`Error fetching Polygon news for ${ticker || 'all'}:`, error)
    throw error
  }
}

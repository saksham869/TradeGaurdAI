const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3'

export async function getEconomicCalendar(from?: string, to?: string) {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) {
    throw new Error('FMP_API_KEY is missing')
  }

  try {
    let url = `${FMP_BASE_URL}/economic_calendar?apikey=${apiKey}`
    if (from && to) {
      url += `&from=${from}&to=${to}`
    }

    const response = await fetch(url)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`FMP API Error: ${response.status} ${errorText}`)
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching FMP Economic Calendar:', error)
    throw error
  }
}

export async function getCompanyProfile(symbol: string) {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) {
    throw new Error('FMP_API_KEY is missing')
  }

  try {
    const response = await fetch(`${FMP_BASE_URL}/profile/${symbol}?apikey=${apiKey}`)
    if (!response.ok) {
       throw new Error(`FMP API Error: ${response.status}`)
    }
    return response.json()
  } catch (error) {
     console.error(`Error fetching FMP profile for ${symbol}:`, error)
     throw error
  }
}

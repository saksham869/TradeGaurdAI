export interface ContentSafetyResult {
  flagged: boolean
  categories: string[]
  severity: number
}

export async function checkContentSafety(text: string): Promise<ContentSafetyResult> {
  const endpoint = process.env.AZURE_CONTENT_SAFETY_ENDPOINT
  const apiKey = process.env.AZURE_CONTENT_SAFETY_KEY

  if (!endpoint || !apiKey) {
    return { flagged: false, categories: [], severity: 0 }
  }

  try {
    const response = await fetch(
      `${endpoint}/contentsafety/text:analyze?api-version=2023-10-01`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.slice(0, 10_000),
          categories: ['Hate', 'SelfHarm', 'Sexual', 'Violence'],
          outputType: 'FourSeverityLevels',
        }),
      }
    )

    if (!response.ok) {
      console.error('Content Safety API error:', response.status)
      return { flagged: false, categories: [], severity: 0 }
    }

    const data = await response.json()
    const flagged: string[] = []
    let maxSeverity = 0

    for (const item of (data.categoriesAnalysis ?? []) as { category: string; severity: number }[]) {
      if (item.severity >= 2) {
        flagged.push(item.category)
        maxSeverity = Math.max(maxSeverity, item.severity)
      }
    }

    return { flagged: flagged.length > 0, categories: flagged, severity: maxSeverity }
  } catch (err) {
    console.error('Content Safety check failed:', err)
    return { flagged: false, categories: [], severity: 0 }
  }
}
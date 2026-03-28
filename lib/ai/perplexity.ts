export async function callPerplexity(prompt: string) {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is missing')
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-large', // From spec
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Perplexity API Error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content as string
  } catch (error) {
    console.error('Perplexity Error:', error)
    throw error
  }
}

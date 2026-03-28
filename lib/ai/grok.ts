export async function callGrok(prompt: string) {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    throw new Error('XAI_API_KEY is missing')
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-beta', // From spec
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Grok API Error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content as string
  } catch (error) {
    console.error('Grok Error:', error)
    throw error
  }
}

// Supports two providers with identical API format:
//   1. Azure OpenAI  — set AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_API_KEY + AZURE_OPENAI_DEPLOYMENT_NAME
//   2. GitHub Models — set GITHUB_TOKEN (free, no credit card needed)
// Azure is tried first. If not configured, falls back to GitHub Models automatically.

async function callOpenAICompatible(
  baseUrl: string,
  authHeader: Record<string, string>,
  model: string,
  prompt: string,
  maxTokens: number
): Promise<string> {
  const url = `${baseUrl}/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`AI provider ${response.status}: ${err.slice(0, 300)}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('AI provider returned empty response')
  return content as string
}

export async function callAzureOpenAI(
  prompt: string,
  options?: { maxTokens?: number }
): Promise<string> {
  const maxTokens = options?.maxTokens ?? 1500

  // ── Option A: Azure OpenAI (your $100 student credit) ──────────────────
  const azureEndpoint  = process.env.AZURE_OPENAI_ENDPOINT
  const azureKey       = process.env.AZURE_OPENAI_API_KEY
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME

  if (azureEndpoint && azureKey && azureDeployment) {
    const base = `${azureEndpoint}/openai/deployments/${azureDeployment}`
    const url  = `${base}/chat/completions?api-version=2024-02-01`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureKey,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Azure OpenAI ${response.status}: ${err.slice(0, 300)}`)
    }

    const data     = await response.json()
    const content  = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Azure OpenAI returned empty response')
    return content as string
  }

  // ── Option B: GitHub Models (completely free) ───────────────────────────
  const githubToken = process.env.GITHUB_TOKEN

  if (githubToken) {
    return callOpenAICompatible(
      'https://models.inference.ai.azure.com',
      { Authorization: `Bearer ${githubToken}` },
      process.env.GITHUB_MODEL ?? 'gpt-4o',
      prompt,
      maxTokens
    )
  }

  throw new Error(
    'No AI provider configured. Add AZURE_OPENAI_API_KEY or GITHUB_TOKEN to .env.local'
  )
}
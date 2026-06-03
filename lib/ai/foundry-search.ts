/**
 * Azure AI Foundry IQ — Knowledge Retrieval Layer
 *
 * Uses the native KnowledgeRetrievalClient from @azure/search-documents
 * to query an Azure AI Foundry Knowledge Base connected to the
 * "financial-knowledge" Azure AI Search index.
 *
 * Priority:
 *  1. Foundry IQ via KnowledgeRetrievalClient (AZURE_FOUNDRY_ENDPOINT + AZURE_KNOWLEDGE_BASE_NAME)
 *  2. Direct Azure AI Search via SearchClient (AZURE_SEARCH_ENDPOINT + AZURE_SEARCH_KEY)
 *  3. Graceful no-op — research continues without grounded context
 */

import {
  KnowledgeRetrievalClient,
  SearchClient,
  AzureKeyCredential,
} from '@azure/search-documents'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FoundryResult {
  title:   string
  content: string
  source:  string
  score:   number
}

export interface FoundryRetrievalOutput {
  available:    boolean
  results:      FoundryResult[]
  citations:    string[]
  contextBlock: string
}

const EMPTY_RESULT: FoundryRetrievalOutput = {
  available: false, results: [], citations: [], contextBlock: '',
}

// ─── Path A: Foundry IQ via KnowledgeRetrievalClient ─────────────────────────

async function fromFoundryIQ(query: string, topK: number): Promise<FoundryRetrievalOutput | null> {
  const endpoint  = process.env.AZURE_FOUNDRY_ENDPOINT
  const key       = process.env.AZURE_FOUNDRY_KEY
  const kbName    = process.env.AZURE_KNOWLEDGE_BASE_NAME

  if (!endpoint || !key || !kbName) return null

  try {
    const client = new KnowledgeRetrievalClient(endpoint, kbName, new AzureKeyCredential(key))

    const response = await client.retrieve({
      intents: [{ type: 'semantic', search: query }],
      maxOutputSizeInTokens: 2000,
    })

    // Extract text from response messages
    const responseTexts: string[] = (response.response ?? []).flatMap(msg =>
      (msg.content ?? [])
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text ?? '')
        .filter(Boolean)
    )

    // Extract citations from references
    const refs = response.references ?? []
    const citations: string[] = Array.from(
      new Set(refs.map((r: any) => r.title ?? r.url ?? r.id ?? 'Azure AI Search').filter(Boolean))
    )

    if (responseTexts.length === 0 && refs.length === 0) return null

    const results: FoundryResult[] = refs.slice(0, topK).map((r: any, i: number) => ({
      title:   r.title ?? `Reference ${i + 1}`,
      content: responseTexts[i] ?? r.excerpt ?? '',
      source:  r.url ?? r.id ?? 'Azure AI Foundry · financial-knowledge',
      score:   1 - i * 0.1,
    }))

    const contextBlock = [
      ...responseTexts,
      ...results.map((r, i) => `[${i + 1}] ${r.title}: ${r.content}`),
    ]
      .filter(Boolean)
      .join('\n\n---\n\n')
      .slice(0, 3000) // cap to avoid huge prompts

    return { available: true, results, citations, contextBlock }

  } catch (err) {
    console.warn('[FoundryIQ] KnowledgeRetrievalClient failed:', (err as Error).message)
    return null
  }
}

// ─── Path B: Direct Azure AI Search ──────────────────────────────────────────

interface RawDoc {
  id:        string
  title:     string
  content:   string
  source:    string
  category?: string
  keywords?: string[]
}

async function fromAISearch(query: string, topK: number): Promise<FoundryRetrievalOutput | null> {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT
  const key      = process.env.AZURE_SEARCH_KEY
  const index    = process.env.AZURE_SEARCH_INDEX ?? 'financial-knowledge'

  if (!endpoint || !key) return null

  try {
    const client = new SearchClient<RawDoc>(endpoint, index, new AzureKeyCredential(key))

    const raw: Array<{ document: RawDoc; score: number }> = []

    // Try semantic first (S1+ tier), fall back to simple text search
    try {
      const r = await client.search(query, {
        top:         topK,
        select:      ['id', 'title', 'content', 'source', 'category', 'keywords'],
        queryType:   'semantic',
        semanticSearchOptions: { configurationName: 'default' },
      })
      for await (const item of r.results) {
        raw.push({ document: item.document, score: item.score ?? 0 })
      }
    } catch {
      const r = await client.search(query, { top: topK, select: ['id', 'title', 'content', 'source', 'category'] })
      for await (const item of r.results) {
        raw.push({ document: item.document, score: item.score ?? 0 })
      }
    }

    if (raw.length === 0) return null

    const results: FoundryResult[] = raw.map(r => ({
      title:   r.document.title   ?? query,
      content: r.document.content ?? '',
      source:  r.document.source  ?? 'Azure AI Search · financial-knowledge',
      score:   r.score,
    }))

    const citations = Array.from(new Set(results.map(r => r.source).filter(Boolean)))

    const contextBlock = results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}`)
      .join('\n\n---\n\n')
      .slice(0, 3000)

    return { available: true, results, citations, contextBlock }

  } catch (err) {
    console.warn('[FoundryIQ] Azure AI Search failed:', (err as Error).message)
    return null
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function retrieveFinancialKnowledge(
  query:  string,
  topK  = 5
): Promise<FoundryRetrievalOutput> {
  // Try Foundry IQ first (native KB), then fall back to direct AI Search
  const result = await fromFoundryIQ(query, topK) ?? await fromAISearch(query, topK)
  return result ?? EMPTY_RESULT
}
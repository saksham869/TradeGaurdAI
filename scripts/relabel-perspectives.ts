/**
 * One-off migration: correct CopilotPerspective rows where model was hardcoded
 * as "claude-3-5-sonnet" / "perplexity+claude" even though only Azure/GitHub
 * keys were ever present.
 *
 * Run: npx tsx scripts/relabel-perspectives.ts
 *
 * Safe to re-run — already-correct rows are untouched.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function correctLabel(model: string): string {
  const bad = ['claude-3-5-sonnet', 'claude-3-5-sonnet-20241022', 'perplexity+claude', 'grok-beta']
  if (!bad.includes(model)) return model

  const azureConfigured =
    process.env.AZURE_OPENAI_ENDPOINT &&
    process.env.AZURE_OPENAI_API_KEY &&
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME
  return azureConfigured ? 'azure-gpt-4o' : 'github-gpt-4o'
}

async function main() {
  const perspectives = await db.copilotPerspective.findMany({
    where: {
      model: {
        in: ['claude-3-5-sonnet', 'claude-3-5-sonnet-20241022', 'perplexity+claude', 'grok-beta'],
      },
    },
    select: { id: true, model: true },
  })

  if (perspectives.length === 0) {
    console.log('No mislabeled rows found — nothing to do.')
    return
  }

  console.log(`Found ${perspectives.length} mislabeled perspective(s). Relabeling…`)

  let updated = 0
  for (const p of perspectives) {
    const newModel = correctLabel(p.model)
    if (newModel !== p.model) {
      await db.copilotPerspective.update({ where: { id: p.id }, data: { model: newModel } })
      updated++
    }
  }

  console.log(`Done. ${updated} row(s) updated.`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => db.$disconnect())
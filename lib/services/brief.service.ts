import db from '../db'
import { routeAITask } from '../ai/router'
import { PROMPTS } from '../ai/prompts'

export async function generateMorningBrief() {
  const dateStr = new Date().toISOString().split('T')[0]

  try {
      const prompt = PROMPTS.MORNING_BRIEF({
        date: dateStr,
        topMovers: 'N/A',
        sectorData: 'N/A',
        economicEvents: 'N/A',
        vix: 15.0
      })

      const resText = await routeAITask('morning_brief', prompt)
      let summary = {}
      try { summary = JSON.parse(resText) } catch { }

      return db.marketBrief.upsert({
        where: { briefDate: dateStr },
          update: { aiSummary: summary as any },
          create: { briefDate: dateStr, aiSummary: summary as any }
      })
  } catch (error) {
      console.error('Error generating morning brief:', error)
      throw error
  }
}

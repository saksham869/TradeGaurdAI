import db from '../db'
import { routeAITask } from '../ai/router'
import { PROMPTS } from '../ai/prompts'

export async function processJournalEntry(userId: string, entryId: string, rawText: string, symbol?: string) {
  try {
     const profile = await db.psychProfile.findUnique({
       where: { userId }
     })

     const recentTags: string[] = profile && profile.tagFrequency ? Object.keys(profile.tagFrequency as any) : []

     const prompt = PROMPTS.JOURNAL_REFLECTION({
       symbol: symbol || null,
       priceMove: null,
       tradedToday: true,
       journalText: rawText,
       recentTags
     })

     const aiResponseText = await routeAITask('journal_reflection', prompt)
     let aiResponse: any = {}
     try {
       aiResponse = JSON.parse(aiResponseText)
     } catch (e) {
       console.error('Failed to parse AI Response for journal:', aiResponseText)
       aiResponse = {
         whatYourThinkingShows: 'Unable to analyze response text.',
         patternMatch: 'None identified.',
         oneThing: 'Continue listing tomorrow with detail.',
         encouragement: 'Stay focused on discipline.',
         emotionTag: 'NEUTRAL',
         riskLevel: 'LOW'
       }
     }

     const emotionTag = aiResponse.emotionTag || 'NEUTRAL'

     const updatedEntry = await db.journalEntry.update({
       where: { id: entryId },
       data: {
         aiResponse: aiResponse,
         emotionTag: emotionTag,
         processingStatus: 'complete'
       }
     })

     if (profile) {
       const tagFrequency = (profile.tagFrequency as any) || {}
       tagFrequency[emotionTag] = (tagFrequency[emotionTag] || 0) + 1

       await db.psychProfile.update({
         where: { userId },
         data: {
           totalEntries: profile.totalEntries + 1,
           tagFrequency: tagFrequency,
         }
       })
     }

     return updatedEntry

  } catch (error) {
     console.error(`Error processing journal entry ${entryId}:`, error)
     throw error
  }
}

import db from '../db'
import { routeAITask } from '../ai/router'
import { PROMPTS } from '../ai/prompts'

// Returns midnight (UTC) of the date string "YYYY-MM-DD" in the user's timezone.
// Used so one journal per calendar day counts as a streak increment.
function toUtcDayKey(date: Date, timezone: string): string {
  return date.toLocaleDateString('en-CA', { timeZone: timezone }) // "YYYY-MM-DD"
}

export async function processJournalEntry(userId: string, entryId: string, rawText: string, symbol?: string) {
  try {
     const profile = await db.psychProfile.findUnique({
       where: { userId }
     })

     const recentTags: string[] = profile && profile.tagFrequency ? Object.keys(profile.tagFrequency as Record<string, unknown>) : []

     const prompt = PROMPTS.JOURNAL_REFLECTION({
       symbol: symbol || null,
       priceMove: null,
       tradedToday: true,
       journalText: rawText,
       recentTags
     })

     const aiResponseText = await routeAITask('journal_reflection', prompt)
     let aiResponse: Record<string, unknown> = {}
     try {
       // Strip fences before parsing
       const stripped = aiResponseText.replace(/```json\n?|```\n?/g, '').trim()
       aiResponse = JSON.parse(stripped)
     } catch {
       aiResponse = {
         whatYourThinkingShows: 'Unable to analyze response text.',
         patternMatch: 'None identified.',
         oneThing: 'Continue journaling tomorrow with detail.',
         encouragement: 'Stay focused on discipline.',
         emotionTag: 'NEUTRAL',
         riskLevel: 'LOW'
       }
     }

     const emotionTag = typeof aiResponse.emotionTag === 'string' ? aiResponse.emotionTag : 'NEUTRAL'

     const updatedEntry = await db.journalEntry.update({
       where: { id: entryId },
       data: {
         aiResponse: aiResponse as Parameters<typeof db.journalEntry.update>[0]['data']['aiResponse'],
         emotionTag: emotionTag as any,
         processingStatus: 'complete'
       }
     })

     // Update PsychProfile: streakDays, longestStreak, totalEntries, tagFrequency
     const user = await db.user.findUnique({ where: { id: userId }, select: { timezone: true } })
     const tz   = user?.timezone ?? 'UTC'
     const todayKey = toUtcDayKey(new Date(), tz)

     if (profile) {
       const tagFrequency = (profile.tagFrequency as Record<string, number>) || {}
       tagFrequency[emotionTag] = (tagFrequency[emotionTag] || 0) + 1

       // Check if we already journaled today to avoid double-counting streak
       const lastEntry = await db.journalEntry.findFirst({
         where: { userId, id: { not: entryId } },
         orderBy: { createdAt: 'desc' },
         select: { createdAt: true },
       })

       const lastDayKey = lastEntry ? toUtcDayKey(lastEntry.createdAt, tz) : null
       const yesterday  = new Date()
       yesterday.setDate(yesterday.getDate() - 1)
       const yesterdayKey = toUtcDayKey(yesterday, tz)

       let newStreak = profile.streakDays
       // Only increment streak if this is first journal of today
       if (lastDayKey !== todayKey) {
         newStreak = lastDayKey === yesterdayKey ? profile.streakDays + 1 : 1
       }
       const newLongest = Math.max(profile.longestStreak, newStreak)

       await db.psychProfile.update({
         where: { userId },
         data: {
           totalEntries: profile.totalEntries + 1,
           tagFrequency,
           streakDays:    newStreak,
           longestStreak: newLongest,
         }
       })
     } else {
       // First journal — create profile
       const tagFrequency: Record<string, number> = { [emotionTag]: 1 }
       await db.psychProfile.create({
         data: {
           userId,
           totalEntries: 1,
           tagFrequency,
           streakDays:    1,
           longestStreak: 1,
         }
       })
     }

     return updatedEntry

  } catch (error) {
     console.error(`Error processing journal entry ${entryId}:`, error)
     throw error
  }
}

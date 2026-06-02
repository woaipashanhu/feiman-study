import { useCallback } from 'react'
import { saveSecure, loadSecure } from '../utils/storage'

export interface LearningRecord {
  boardId: string
  contentId: string
  contentTitle: string
  completed: boolean
  duration: number
  lastVisitAt: number
  visits: number
}

export interface AchievementState {
  totalLearned: number
  totalDuration: number
  streakDays: number
  stars: number
  badges: string[]
  lastLearnDate: string
}

const LEARNING_KEY = 'feiman_learning_records'
const ACHIEVEMENT_KEY = 'feiman_achievement'

export function useLearningTracker() {
  const getRecords = useCallback((): LearningRecord[] => {
    return loadSecure<LearningRecord[]>(LEARNING_KEY) || []
  }, [])

  const recordVisit = useCallback((record: Omit<LearningRecord, 'lastVisitAt' | 'visits'>) => {
    const records = getRecords()
    const existing = records.find(
      (r) => r.boardId === record.boardId && r.contentId === record.contentId
    )

    const now = Date.now()
    const today = new Date().toISOString().split('T')[0]

    if (existing) {
      existing.lastVisitAt = now
      existing.visits += 1
      existing.duration += record.duration
      existing.completed = record.completed || existing.completed
    } else {
      records.push({
        ...record,
        lastVisitAt: now,
        visits: 1,
      })
    }

    saveSecure(LEARNING_KEY, records)

    // 更新成就
    const achievement = loadSecure<AchievementState>(ACHIEVEMENT_KEY) || {
      totalLearned: 0,
      totalDuration: 0,
      streakDays: 0,
      stars: 0,
      badges: [],
      lastLearnDate: '',
    }

    achievement.totalLearned = records.filter((r) => r.completed).length
    achievement.totalDuration = records.reduce((sum, r) => sum + r.duration, 0)

    // 连续天数计算
    if (achievement.lastLearnDate !== today) {
      const lastDate = new Date(achievement.lastLearnDate)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000)

      if (diffDays === 1) {
        achievement.streakDays += 1
      } else if (diffDays > 1) {
        achievement.streakDays = 1
      }
      achievement.lastLearnDate = today
    }

    // 星星奖励
    if (record.completed) {
      achievement.stars += 1
    }

    saveSecure(ACHIEVEMENT_KEY, achievement)
  }, [getRecords])

  const getAchievement = useCallback((): AchievementState => {
    return (
      loadSecure<AchievementState>(ACHIEVEMENT_KEY) || {
        totalLearned: 0,
        totalDuration: 0,
        streakDays: 0,
        stars: 0,
        badges: [],
        lastLearnDate: '',
      }
    )
  }, [])

  return { getRecords, recordVisit, getAchievement }
}

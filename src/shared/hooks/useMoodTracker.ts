/**
 * ============================================================
 *  useMoodTracker — 心情记录 Hook
 *
 *  功能：
 *    - 每日一条心情记录（文字 + emoji）
 *    - localStorage 持久化（复用 saveSecure/loadSecure）
 *    - 查询历史心情（最近 N 天）
 *    - 心情趋势统计
 *
 *  数据结构：
 *    MoodRecord { date, text, emoji, createdAt }
 *
 *  使用方式：
 *    const { todayMood, saveMood, getRecentMoods } = useMoodTracker()
 * ============================================================
 */
import { useCallback } from 'react'
import { saveSecure, loadSecure } from '../utils/storage'

export type MoodEmoji = '😊' | '😐' | '😢' | '🤩' | '😴' | '💪' | '🤔' | '❤️'

export interface MoodRecord {
  /** 日期字符串 YYYY-MM-DD */
  date: string
  /** 心情文字 */
  text: string
  /** 心情 emoji */
  emoji: MoodEmoji
  /** 创建时间戳 */
  createdAt: number
}

const MOOD_KEY = 'feiman_mood_records'

/** 预设心情选项 */
export const MOOD_OPTIONS: { emoji: MoodEmoji; label: string }[] = [
  { emoji: '😊', label: '开心' },
  { emoji: '🤩', label: '兴奋' },
  { emoji: '💪', label: '有劲' },
  { emoji: '😐', label: '一般' },
  { emoji: '🤔', label: '思考' },
  { emoji: '😴', label: '疲惫' },
  { emoji: '😢', label: '低落' },
  { emoji: '❤️', label: '感恩' },
]

/** 获取今天日期字符串 */
function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function useMoodTracker() {
  /** 获取所有心情记录 */
  const getAllMoods = useCallback((): MoodRecord[] => {
    return loadSecure<MoodRecord[]>(MOOD_KEY) || []
  }, [])

  /** 获取今日心情 */
  const getTodayMood = useCallback((): MoodRecord | null => {
    const moods = getAllMoods()
    const today = getTodayStr()
    return moods.find((m) => m.date === today) || null
  }, [getAllMoods])

  /** 保存/更新今日心情 */
  const saveMood = useCallback((text: string, emoji: MoodEmoji): MoodRecord => {
    const moods = getAllMoods()
    const today = getTodayStr()
    const now = Date.now()

    // 查找是否已有今天的记录
    const existingIdx = moods.findIndex((m) => m.date === today)

    const record: MoodRecord = {
      date: today,
      text: text.trim(),
      emoji,
      createdAt: existingIdx >= 0 ? moods[existingIdx].createdAt : now,
    }

    if (existingIdx >= 0) {
      // 更新已有记录
      moods[existingIdx] = record
    } else {
      // 新增记录（最多保留 90 天）
      moods.unshift(record)
      // 清理超过 90 天的旧数据
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 90)
      const cutoffStr = cutoff.toISOString().split('T')[0]
      const filtered = moods.filter((m) => m.date >= cutoffStr)
      if (filtered.length < moods.length) {
        moods.length = 0
        moods.push(...filtered)
      }
    }

    saveSecure(MOOD_KEY, moods)
    return record
  }, [getAllMoods])

  /** 获取最近 N 条心情记录 */
  const getRecentMoods = useCallback((count = 7): MoodRecord[] => {
    return getAllMoods().slice(0, count)
  }, [getAllMoods])

  /** 获取心情趋势（按 emoji 分组统计最近 30 天） */
  const getMoodTrend = useCallback((): Record<MoodEmoji, number> => {
    const moods = getAllMoods()
    const trend: Record<string, number> = {}
    for (const opt of MOOD_OPTIONS) {
      trend[opt.emoji] = 0
    }
    // 只看最近 30 天
    const cutoff = Date.now() - 30 * 86400000
    for (const m of moods) {
      if (m.createdAt >= cutoff) {
        trend[m.emoji] = (trend[m.emoji] || 0) + 1
      }
    }
    return trend as Record<MoodEmoji, number>
  }, [getAllMoods])

  return {
    getTodayMood,
    saveMood,
    getRecentMoods,
    getMoodTrend,
    getAllMoods,
    MOOD_OPTIONS,
  }
}

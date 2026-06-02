/**
 * ============================================================
 *  useFeedback — 意见反馈 Hook
 *
 *  功能：
 *    - 分类反馈（建议/Bug/内容请求/其他）
 *    - localStorage 持久化
 *    - 反馈历史查询
 *    - 预设分类选项
 *
 *  数据结构：
 *    Feedback { id, text, category, createdAt }
 *
 *  使用方式：
 *    const { submitFeedback, getFeedbacks, feedbackCategories } = useFeedback()
 * ============================================================
 */
import { useCallback } from 'react'
import { saveSecure, loadSecure } from '../utils/storage'

export type FeedbackCategory = 'suggestion' | 'bug' | 'content' | 'other'

export interface Feedback {
  /** 唯一 ID（时间戳 + 随机） */
  id: string
  /** 反馈文字 */
  text: string
  /** 反馈分类 */
  category: FeedbackCategory
  /** 创建时间戳 */
  createdAt: number
}

/** 反馈分类选项（带 icon 和 label） */
export const FEEDBACK_CATEGORIES: { value: FeedbackCategory; label: string; icon: string }[] = [
  { value: 'suggestion', label: '功能建议', icon: '💡' },
  { value: 'bug', label: 'Bug 反馈', icon: '🐛' },
  { value: 'content', label: '内容需求', icon: '📚' },
  { value: 'other', label: '其他', icon: '💬' },
]

const FEEDBACK_KEY = 'feiman_feedback_records'

/** 生成简单唯一 ID */
function generateId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
}

export function useFeedback() {
  /** 提交反馈 */
  const submitFeedback = useCallback((text: string, category: FeedbackCategory): Feedback => {
    const feedbacks = loadSecure<Feedback[]>(FEEDBACK_KEY) || []

    const feedback: Feedback = {
      id: generateId(),
      text,
      category,
      createdAt: Date.now(),
    }

    // 新反馈插到最前面
    feedbacks.unshift(feedback)

    // 最多保留 100 条
    if (feedbacks.length > 100) {
      feedbacks.length = 100
    }

    saveSecure(FEEDBACK_KEY, feedbacks)
    return feedback
  }, [])

  /** 获取所有反馈记录（按时间倒序） */
  const getFeedbacks = useCallback((): Feedback[] => {
    return loadSecure<Feedback[]>(FEEDBACK_KEY) || []
  }, [])

  /** 获取最近 N 条反馈 */
  const getRecentFeedbacks = useCallback((count = 10): Feedback[] => {
    return getFeedbacks().slice(0, count)
  }, [getFeedbacks])

  /** 按分类统计 */
  const getFeedbackStats = useCallback((): Record<FeedbackCategory, number> => {
    const all = getFeedbacks()
    const stats: Record<string, number> = {}
    for (const cat of FEEDBACK_CATEGORIES) {
      stats[cat.value] = 0
    }
    for (const f of all) {
      stats[f.category] = (stats[f.category] || 0) + 1
    }
    return stats as Record<FeedbackCategory, number>
  }, [getFeedbacks])

  /** 清空所有反馈（调试用） */
  const clearAllFeedbacks = useCallback(() => {
    saveSecure(FEEDBACK_KEY, [])
  }, [])

  return {
    submitFeedback,
    getFeedbacks,
    getRecentFeedbacks,
    getFeedbackStats,
    clearAllFeedbacks,
    feedbackCategories: FEEDBACK_CATEGORIES,
  }
}

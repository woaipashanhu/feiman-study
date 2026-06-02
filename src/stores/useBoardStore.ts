import { create } from 'zustand'
import type { BoardConfig } from '@/types/board'
// BoardIconName 通过 BoardConfig.icon 字段的类型约束间接生效
// 无需在此处直接 import（避免 unused import 警告）

// 板块配置（内联，不依赖 JSON 文件）
const boardsData: BoardConfig[] = [
  {
    id: 'math',
    name: '数学',
    path: '/math',
    icon: 'Calculator',
    color: '#4F6EF7',
    description: '费曼数学视频课程',
  },
  {
    id: 'science',
    name: '科学',
    path: '/science',
    icon: 'Atom',
    color: '#00C9A7',
    description: '3D科学探索',
  },
  {
    id: 'social',
    name: '社会训练',
    path: '/social',
    icon: 'BookOpen',
    color: '#FF9F43',
    description: '社交故事绘本',
  },
  {
    id: 'gallery',
    name: '画廊',
    path: '/gallery',
    icon: 'Image',
    color: '#A55EEA',
    description: '作品展示',
  },
  {
    id: 'neimen',
    name: '内功',
    path: '/neimen',
    icon: 'Sparkle',
    color: '#FF6B6B',
    description: '进阶学习卡片',
  },
]

/**
 * ============================================================
 *  全局 Store — 架构设计 §五.3
 *
 *  分层结构：
 *    - board: 板块状态（当前活跃板块）
 *    - learning: 学习追踪（第二阶段接入 useLearningTracker）
 *    - achievement: 成就系统（第二阶段）
 *    - settings: 用户设置（第二阶段）
 *    - user: 用户信息（第二阶段）
 *
 *  持久化策略：
 *    - 仅持久化 activeBoardId + settings + user（通过 partialize）
 *    - learning/achievement 不持久化（每次重新计算，避免脏数据）
 * ============================================================
 */

/** 第二阶段：学习追踪状态 */
interface LearningState {
  todayContentCount: number
  todayDurationMinutes: number
  streakDays: number
}

/** 第二阶段：成就系统状态 */
interface AchievementState {
  totalLearned: number
  totalDuration: number
  streakDays: number
  stars: number
  badges: string[]
  lastLearnDate: string
}

/** 第二阶段：用户设置 */
interface SettingsState {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  autoPlayVideo: boolean
  soundEnabled: boolean
}

/** 第二阶段：用户信息 */
interface UserState {
  nickname?: string
  avatar?: string
  joinDate?: string
}

interface BoardState {
  // ===== 板块状态 =====
  boards: BoardConfig[]
  activeBoardId: string
  setActiveBoard: (id: string) => void
  getActiveBoard: () => BoardConfig | undefined

  // ===== 第二阶段预留：学习追踪 =====
  learning: LearningState

  // ===== 第二阶段预留：成就系统 =====
  achievement: AchievementState

  // ===== 第二阶段预留：用户设置 =====
  settings: SettingsState

  // ===== 第二阶段预留：用户信息 =====
  user: UserState
}

const DEFAULT_LEARNING: LearningState = {
  todayContentCount: 0,
  todayDurationMinutes: 0,
  streakDays: 0,
}

const DEFAULT_ACHIEVEMENT: AchievementState = {
  totalLearned: 0,
  totalDuration: 0,
  streakDays: 0,
  stars: 0,
  badges: [],
  lastLearnDate: '',
}

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'auto',
  language: 'zh-CN',
  autoPlayVideo: true,
  soundEnabled: true,
}

const DEFAULT_USER: UserState = {}

export const useBoardStore = create<BoardState>((set, get) => ({
  // ===== 板块状态 =====
  boards: boardsData,
  activeBoardId: 'math',
  setActiveBoard: (id) => set({ activeBoardId: id }),
  getActiveBoard: () => {
    const { boards, activeBoardId } = get()
    return boards.find((b) => b.id === activeBoardId)
  },

  // ===== 第二阶段预留 =====
  learning: DEFAULT_LEARNING,
  achievement: DEFAULT_ACHIEVEMENT,
  settings: DEFAULT_SETTINGS,
  user: DEFAULT_USER,
}))

/**
 * partialize — 仅持久化以下字段到 localStorage：
 *   - activeBoardId: 记住用户最后停留的板块
 *   - settings: 用户偏好设置
 *   - user: 用户基本信息
 *
 * 不持久化的字段（每次启动重置）：
 *   - learning: 需要实时计算
 *   - achievement: 需要从历史记录重建
 */
export const persistPartialize = (state: BoardState) => ({
  activeBoardId: state.activeBoardId,
  settings: state.settings,
  user: state.user,
})

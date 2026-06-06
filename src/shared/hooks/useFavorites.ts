/**
 * ============================================================
 *  useFavorites — 收藏系统 Hook
 *
 *  功能：
 *    - 跨 5 个板块统一收藏（数学/科学/社交/画廊/内功）
 *    - LocalStorage 持久化（复用 saveSecure/loadSecure）
 *    - 跨标签页/同页多组件实时同步（storage 事件 + 自定义事件）
 *    - 上限 200 条
 *
 *  数据结构：
 *    FavoriteItem { id, boardId, contentId, title, cover?, subtitle?, addedAt }
 *
 *  使用方式：
 *    const { isFavorited, toggleFavorite, getAllFavorites } = useFavorites()
 * ============================================================
 */
import { useCallback, useEffect, useState } from 'react'
import { saveSecure, loadSecure } from '../utils/storage'

export type BoardId = 'math' | 'science' | 'social' | 'gallery' | 'neimen'

export interface FavoriteItem {
  /** 唯一 id: `${boardId}:${contentId}` */
  id: string
  /** 板块 id */
  boardId: BoardId
  /** 内容 id */
  contentId: string
  /** 标题 */
  title: string
  /** 缩略图 (图片 URL,可选) */
  cover?: string
  /** 视频 URL (可选,有的话 marquee 里会播放动画) */
  videoUrl?: string
  /** 副标题/描述 (可选) */
  subtitle?: string
  /** 收藏时间戳 */
  addedAt: number
}

const FAVORITES_KEY = 'feiman_favorites'
const MAX_FAVORITES = 200

/** 板块中文名 */
export const BOARD_LABELS: Record<BoardId, string> = {
  math: '数学课',
  science: '科学',
  social: '社交训练',
  gallery: '童画廊',
  neimen: '内功养生',
}

/** 板块 emoji */
export const BOARD_EMOJIS: Record<BoardId, string> = {
  math: '🔢',
  science: '🌌',
  social: '🤝',
  gallery: '🎨',
  neimen: '💪',
}

/** 板块播放页路由 */
export const BOARD_PATH: Record<BoardId, (contentId: string) => string> = {
  math: (id) => `/math/lesson/${id}`,
  science: (id) => `/science/${id}`,
  social: (id) => `/social/scene/${id}`,
  gallery: (id) => `/gallery/${id}`,
  neimen: (id) => `/neimen/${id}`,
}

/** 板块主题色 */
export const BOARD_COLORS: Record<BoardId, string> = {
  math: '#3B82F6',
  science: '#8B5CF6',
  social: '#F59E0B',
  gallery: '#EC4899',
  neimen: '#10B981',
}

/** 自定义事件名（用于同页面多组件同步） */
const FAVORITES_CHANGE_EVENT = 'feiman:favorites-changed'

function makeId(boardId: BoardId, contentId: string): string {
  return `${boardId}:${contentId}`
}

/** 读取所有收藏 */
function readAll(): FavoriteItem[] {
  return loadSecure<FavoriteItem[]>(FAVORITES_KEY) || []
}

/** 写回所有收藏（限制 200 条） */
function writeAll(items: FavoriteItem[]): void {
  const limited = items.slice(0, MAX_FAVORITES)
  saveSecure(FAVORITES_KEY, limited)
}

export function useFavorites() {
  // 用 React state 触发组件重渲染
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  // 订阅 storage 事件（跨标签页）+ 自定义事件（同页多组件）
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes(FAVORITES_KEY)) bump()
    }
    const onCustom = () => bump()
    window.addEventListener('storage', onStorage)
    window.addEventListener(FAVORITES_CHANGE_EVENT, onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(FAVORITES_CHANGE_EVENT, onCustom)
    }
  }, [bump])

  // 通知其他同页组件
  const notify = useCallback(() => {
    window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT))
  }, [])

  /** 获取所有收藏 */
  const getAllFavorites = useCallback((): FavoriteItem[] => {
    // version 引用让 React 知道依赖变化
    void version
    return readAll()
  }, [version])

  /** 检查是否已收藏 */
  const isFavorited = useCallback(
    (boardId: BoardId, contentId: string): boolean => {
      void version
      const items = readAll()
      return items.some((it) => it.id === makeId(boardId, contentId))
    },
    [version]
  )

  /** 添加收藏 */
  const addFavorite = useCallback(
    (item: Omit<FavoriteItem, 'id' | 'addedAt'>): FavoriteItem => {
      const items = readAll()
      const id = makeId(item.boardId, item.contentId)
      if (items.some((it) => it.id === id)) {
        // 已存在,更新时间
        const idx = items.findIndex((it) => it.id === id)
        const updated: FavoriteItem = { ...items[idx], ...item, id, addedAt: Date.now() }
        items[idx] = updated
        writeAll(items)
        notify()
        return updated
      }
      const fav: FavoriteItem = { ...item, id, addedAt: Date.now() }
      items.unshift(fav)
      writeAll(items)
      notify()
      return fav
    },
    [notify]
  )

  /** 移除收藏 */
  const removeFavorite = useCallback(
    (boardId: BoardId, contentId: string): boolean => {
      const items = readAll()
      const id = makeId(boardId, contentId)
      const idx = items.findIndex((it) => it.id === id)
      if (idx < 0) return false
      items.splice(idx, 1)
      writeAll(items)
      notify()
      return true
    },
    [notify]
  )

  /** 切换收藏状态 */
  const toggleFavorite = useCallback(
    (item: Omit<FavoriteItem, 'id' | 'addedAt'>): boolean => {
      const items = readAll()
      const id = makeId(item.boardId, item.contentId)
      const exists = items.some((it) => it.id === id)
      if (exists) {
        removeFavorite(item.boardId, item.contentId)
        return false
      }
      addFavorite(item)
      return true
    },
    [addFavorite, removeFavorite]
  )

  /** 按板块获取 */
  const getFavoritesByBoard = useCallback(
    (boardId: BoardId): FavoriteItem[] => {
      void version
      return readAll().filter((it) => it.boardId === boardId)
    },
    [version]
  )

  /** 获取最近 N 条 */
  const getRecentFavorites = useCallback(
    (count = 8): FavoriteItem[] => {
      void version
      return readAll().slice(0, count)
    },
    [version]
  )

  /** 总数 */
  const count = useCallback((): number => {
    void version
    return readAll().length
  }, [version])

  /** 各板块数量 */
  const countByBoard = useCallback((): Record<BoardId, number> => {
    void version
    const items = readAll()
    const result: Record<string, number> = {
      math: 0, science: 0, social: 0, gallery: 0, neimen: 0,
    }
    for (const it of items) {
      result[it.boardId] = (result[it.boardId] || 0) + 1
    }
    return result as Record<BoardId, number>
  }, [version])

  return {
    isFavorited,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getAllFavorites,
    getFavoritesByBoard,
    getRecentFavorites,
    count,
    countByBoard,
  }
}

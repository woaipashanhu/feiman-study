/**
 * ============================================================
 *  useLetters — 小纸条模块 Hook
 *
 *  功能:
 *    - CRUD 全部纸条 (quote / personal / compose)
 *    - LocalStorage 持久化 (复用 saveSecure/loadSecure Base64 加密)
 *    - 跨标签页/同页多组件实时同步
 *    - 首次进入自动 seed 系统欢迎信 (SYSTEM_WELCOME_LETTER)
 *    - 上限 MAX_LETTERS (500)
 *
 *  ⚠️ 关键 bug 修复:广播用 CustomEvent 时,handler 必须
 *     检测 e instanceof CustomEvent 直接 return,
 *     否则会读 localStorage 用"旧空 state"覆盖刚 setState 的新数据
 * ============================================================
 */
import { useCallback, useEffect, useState } from 'react'
import { saveSecure, loadSecure } from '../utils/storage'
import {
  LETTERS_KEY,
  MAX_LETTERS,
  SYSTEM_WELCOME_LETTER,
  sortLetters,
  type Letter,
  type LetterKind,
  type Translations,
  type PaperBg,
} from '@/types/letters'

/** 自定义事件名(同页面多组件同步) */
const LETTERS_CHANGE_EVENT = 'feiman:letters-changed'

/** 读取所有 letters(带 seed 欢迎信) */
function readAll(): Letter[] {
  let items = loadSecure<Letter[]>(LETTERS_KEY) || []
  // 首次进入 seed 系统欢迎信
  if (!items.some((l) => l.isSystem && l.author === SYSTEM_WELCOME_LETTER.author)) {
    const now = Date.now()
    const welcome: Letter = {
      id: `sys_welcome_${now}`,
      createdAt: now,
      updatedAt: now,
      ...SYSTEM_WELCOME_LETTER,
    }
    items = [welcome, ...items]
    writeAll(items)
  }
  return items
}

/** 写回所有 letters(限制 500 条) */
function writeAll(items: Letter[]): void {
  const limited = items.slice(0, MAX_LETTERS)
  saveSecure(LETTERS_KEY, limited)
}

export function useLetters() {
  // 用 React state 触发组件重渲染
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  // 订阅 storage 事件(跨标签页)+ 自定义事件(同页多组件)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes(LETTERS_KEY)) bump()
    }
    const onCustom = (e: Event) => {
      // ⚠️ 关键:CustomEvent 自身触发时,不要 reload localStorage,
      // 否则会用"旧空 state"覆盖刚 setState 的新数据
      // (教训:2026-06-06,详见 agent memory)
      if (e instanceof CustomEvent) return
      bump()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(LETTERS_CHANGE_EVENT, onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(LETTERS_CHANGE_EVENT, onCustom)
    }
  }, [bump])

  /** 通知其他同页组件(用 CustomEvent 而不是 storage 事件) */
  const notify = useCallback(() => {
    window.dispatchEvent(new CustomEvent(LETTERS_CHANGE_EVENT))
  }, [])

  /** 获取所有 letters(按优先级 + updatedAt 排序) */
  const getAllLetters = useCallback((): Letter[] => {
    void version
    return sortLetters(readAll())
  }, [version])

  /** 按 kind 获取 */
  const getByKind = useCallback(
    (kind: LetterKind): Letter[] => {
      void version
      return sortLetters(readAll().filter((l) => l.kind === kind))
    },
    [version]
  )

  /** 获取单条 */
  const getById = useCallback(
    (id: string): Letter | null => {
      void version
      return readAll().find((l) => l.id === id) || null
    },
    [version]
  )

  /** 收藏到时空纸条(把今日 quote 变成 quote 类 letter) */
  const addQuote = useCallback(
    (args: {
      content: string
      author?: string
      dynasty?: string
      bgKey?: PaperBg
      translations?: Translations
    }): Letter => {
      const items = readAll()
      const now = Date.now()
      const letter: Letter = {
        id: `quote_${now}_${Math.random().toString(36).slice(2, 8)}`,
        kind: 'quote',
        content: args.content,
        author: args.author,
        dynasty: args.dynasty,
        bgKey: args.bgKey ?? 'ivory',
        translations: args.translations,
        isStarred: true,
        createdAt: now,
        updatedAt: now,
      }
      items.unshift(letter)
      writeAll(items)
      notify()
      return letter
    },
    [notify]
  )

  /** 添加收到的纸条(系统/分享 token 解出来的 personal) */
  const addPersonal = useCallback(
    (args: {
      content: string
      author?: string
      bgKey?: PaperBg
      translations?: Translations
      isSystem?: boolean
      refPersonalId?: string
    }): Letter => {
      const items = readAll()
      const now = Date.now()
      const letter: Letter = {
        id: `personal_${now}_${Math.random().toString(36).slice(2, 8)}`,
        kind: 'personal',
        content: args.content,
        author: args.author,
        bgKey: args.bgKey ?? 'ivory',
        translations: args.translations,
        isStarred: true,
        isSystem: args.isSystem ?? false,
        refPersonalId: args.refPersonalId,
        createdAt: now,
        updatedAt: now,
      }
      items.unshift(letter)
      writeAll(items)
      notify()
      return letter
    },
    [notify]
  )

  /** 添加写过的纸条(用户写信历史) */
  const addCompose = useCallback(
    (args: {
      content: string
      author?: string
      bgKey?: PaperBg
      translations?: Translations
      refQuoteId?: string
      shareToken?: string
    }): Letter => {
      const items = readAll()
      const now = Date.now()
      const letter: Letter = {
        id: `compose_${now}_${Math.random().toString(36).slice(2, 8)}`,
        kind: 'compose',
        content: args.content,
        author: args.author,
        bgKey: args.bgKey ?? 'ivory',
        translations: args.translations,
        isStarred: false,
        refQuoteId: args.refQuoteId,
        shareToken: args.shareToken,
        createdAt: now,
        updatedAt: now,
      }
      items.unshift(letter)
      writeAll(items)
      notify()
      return letter
    },
    [notify]
  )

  /** 更新 letter(改内容/翻译等) */
  const updateLetter = useCallback(
    (id: string, patch: Partial<Omit<Letter, 'id' | 'createdAt'>>): Letter | null => {
      const items = readAll()
      const idx = items.findIndex((l) => l.id === id)
      if (idx < 0) return null
      const updated: Letter = {
        ...items[idx],
        ...patch,
        id: items[idx].id,
        createdAt: items[idx].createdAt,
        updatedAt: Date.now(),
      }
      items[idx] = updated
      writeAll(items)
      notify()
      return updated
    },
    [notify]
  )

  /** 切换 isStarred */
  const toggleStar = useCallback(
    (id: string): boolean => {
      const items = readAll()
      const idx = items.findIndex((l) => l.id === id)
      if (idx < 0) return false
      items[idx] = {
        ...items[idx],
        isStarred: !items[idx].isStarred,
        updatedAt: Date.now(),
      }
      writeAll(items)
      notify()
      return items[idx].isStarred
    },
    [notify]
  )

  /** 删除(系统信不可删) */
  const removeLetter = useCallback(
    (id: string): boolean => {
      const items = readAll()
      const target = items.find((l) => l.id === id)
      if (!target) return false
      if (target.isSystem) return false // 系统信保护
      const next = items.filter((l) => l.id !== id)
      writeAll(next)
      notify()
      return true
    },
    [notify]
  )

  /** 总数 */
  const count = useCallback((): number => {
    void version
    return readAll().length
  }, [version])

  /** 按 kind 统计 */
  const countByKind = useCallback((): Record<LetterKind, number> => {
    void version
    const items = readAll()
    const result: Record<LetterKind, number> = { quote: 0, personal: 0, compose: 0 }
    for (const l of items) result[l.kind]++
    return result
  }, [version])

  return {
    getAllLetters,
    getByKind,
    getById,
    addQuote,
    addPersonal,
    addCompose,
    updateLetter,
    toggleStar,
    removeLetter,
    count,
    countByKind,
  }
}

/** 工具:生成一个分享 token(简易版,V1 未真正使用) */
export function genShareToken(): string {
  return `sl_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

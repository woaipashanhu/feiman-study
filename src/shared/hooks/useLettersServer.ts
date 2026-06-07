/**
 * ============================================================
 *  useLettersServer — 小纸条后端 API 客户端(V1+V3)
 *
 *  V1 接口(无登录):
 *    POST   /letters                     create
 *    GET    /letters?limit=20            list
 *    GET    /letters/:id                 get by id
 *    GET    /letters/by-token/:token     get by token
 *    POST   /letters/:id/collect         collect(全局计数)
 *
 *  V3 接口(需登录,自动带 Authorization + 401 自动 refresh):
 *    POST   /letters/:id/star            star 到"时空纸条"
 *    GET    /me/inbox?limit=20           收件箱
 *
 *  失败降级: 后端不可用时,所有方法 throw(调用方需 try/catch)
 *  V1 不做离线缓存(V2 加 IndexedDB 缓存)
 * ============================================================
 */
import { apiFetch } from './apiClient'

export interface ServerLetter {
  id: string
  content: string
  author: string | null
  authorUserId: string | null
  bgKey: string
  translations: { classicalChinese?: string; english?: string } | null
  shareToken: string
  collectCount: number
  viewCount: number
  createdAt: number
  updatedAt: number
}

export interface ServerUser {
  id: string
  email: string | null
  phone: string | null
  nickname: string
  createdAt: number
  updatedAt: number
}

export interface InboxResponse {
  ok: boolean
  user: ServerUser
  letters: ServerLetter[]
}

export const lettersApi = {
  /** POST /letters — 创建,带 token 时 author = 用户 nickname */
  async create(args: {
    content: string
    author?: string
    bgKey?: 'ivory' | 'midnight' | 'kraft'
    translations?: { classicalChinese?: string; english?: string }
  }): Promise<ServerLetter> {
    const data = await apiFetch<{ ok: boolean; letter: ServerLetter }>('/letters', {
      method: 'POST',
      body: JSON.stringify(args),
    })
    return data.letter
  },

  /** GET /letters?limit=20 */
  async list(limit = 20): Promise<ServerLetter[]> {
    const data = await apiFetch<{ ok: boolean; letters: ServerLetter[] }>(`/letters?limit=${limit}`)
    return data.letters
  },

  /** GET /letters/:id */
  async getById(id: string): Promise<ServerLetter | null> {
    try {
      const data = await apiFetch<{ ok: boolean; letter: ServerLetter }>(`/letters/${id}`)
      return data.letter
    } catch (e) {
      if (String(e).includes('404')) return null
      throw e
    }
  },

  /** GET /letters/by-token/:token */
  async getByToken(token: string): Promise<ServerLetter | null> {
    try {
      const data = await apiFetch<{ ok: boolean; letter: ServerLetter }>(
        `/letters/by-token/${token}`
      )
      return data.letter
    } catch (e) {
      if (String(e).includes('404')) return null
      throw e
    }
  },

  /** POST /letters/:id/collect — 收藏(全局计数) */
  async collect(id: string): Promise<number> {
    const data = await apiFetch<{ ok: boolean; collectCount: number }>(`/letters/${id}/collect`, {
      method: 'POST',
    })
    return data.collectCount
  },

  /** POST /letters/:id/star — 收藏到"时空纸条"(需登录) */
  async star(id: string): Promise<{ userId: string; letterId: string }> {
    return apiFetch(`/letters/${id}/star`, { method: 'POST' })
  },

  /** GET /me/inbox?limit=20 — 收件箱(需登录) */
  async inbox(limit = 20): Promise<InboxResponse> {
    return apiFetch<InboxResponse>(`/me/inbox?limit=${limit}`)
  },

  /** GET /health */
  async health(): Promise<{ ok: boolean; ts: number; version?: string }> {
    return apiFetch('/health')
  },
}

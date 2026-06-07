/**
 * ============================================================
 *  useLettersServer — 小纸条后端 API 客户端(V1)
 *
 *  端点: /api/letters
 *    POST /                            create
 *    GET  /                            list(默认 20)
 *    GET  /:id                         get by id
 *    GET  /by-token/:token             get by token(分享落地页)
 *    POST /:id/collect                 collect(全局计数)
 *    GET  /_health                     health
 *
 *  失败降级: 后端不可用时,所有方法 throw(调用方需 try/catch)
 *  V1 不做离线缓存(V2 加 IndexedDB 缓存)
 * ============================================================
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export interface ServerLetter {
  id: string
  content: string
  author: string | null
  bgKey: string
  translations: { classicalChinese?: string; english?: string } | null
  shareToken: string
  collectCount: number
  viewCount: number
  createdAt: number
  updatedAt: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    let detail: unknown
    try {
      detail = await res.json()
    } catch {
      detail = await res.text()
    }
    throw new Error(`API ${res.status}: ${JSON.stringify(detail)}`)
  }
  return res.json() as Promise<T>
}

export const lettersApi = {
  /** POST /api/letters — 创建一张纸条,返回 shareToken */
  async create(args: {
    content: string
    author?: string
    bgKey?: 'ivory' | 'midnight' | 'kraft'
    translations?: { classicalChinese?: string; english?: string }
  }): Promise<ServerLetter> {
    const data = await request<{ ok: boolean; letter: ServerLetter }>('/letters', {
      method: 'POST',
      body: JSON.stringify(args),
    })
    return data.letter
  },

  /** GET /api/letters?limit=20 — 列表 */
  async list(limit = 20): Promise<ServerLetter[]> {
    const data = await request<{ ok: boolean; letters: ServerLetter[] }>(
      `/letters?limit=${limit}`
    )
    return data.letters
  },

  /** GET /api/letters/:id — 按 id 读 */
  async getById(id: string): Promise<ServerLetter | null> {
    try {
      const data = await request<{ ok: boolean; letter: ServerLetter }>(`/letters/${id}`)
      return data.letter
    } catch (e) {
      if (String(e).includes('404')) return null
      throw e
    }
  },

  /** GET /api/letters/by-token/:token — 按分享 token 读 */
  async getByToken(token: string): Promise<ServerLetter | null> {
    try {
      const data = await request<{ ok: boolean; letter: ServerLetter }>(
        `/letters/by-token/${token}`
      )
      return data.letter
    } catch (e) {
      if (String(e).includes('404')) return null
      throw e
    }
  },

  /** POST /api/letters/:id/collect — 收藏(全局计数) */
  async collect(id: string): Promise<number> {
    const data = await request<{ ok: boolean; collectCount: number }>(
      `/letters/${id}/collect`,
      { method: 'POST' }
    )
    return data.collectCount
  },

  /** GET /api/health — 健康检查 */
  async health(): Promise<{ ok: boolean; ts: number }> {
    return request('/health')
  },
}

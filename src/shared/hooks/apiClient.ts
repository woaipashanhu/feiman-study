/**
 * ============================================================
 *  apiClient — fetch wrapper with auto-refresh on 401
 *
 *  用法:
 *    import { apiFetch } from '@/shared/hooks/apiClient'
 *    const data = await apiFetch('/letters', { method: 'POST', body: JSON.stringify(...) })
 *
 *  行为:
 *    - 自动从 useAuth 拿 accessToken, 加 Authorization header
 *    - 收到 401 时,自动用 refreshToken 换新 accessToken,重试原请求
 *    - 二次 401 仍失败:清掉 token,跳登录(待 V3.5 加)
 *
 *  不依赖 React(纯函数),在 hooks / 普通函数里都能用
 * ============================================================
 */
import { getAccessToken } from './useAuth'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

interface ApiFetchInit extends Omit<RequestInit, 'body'> {
  body?: string
  /** 跳过自动 refresh(用于 /auth/refresh / /auth/login / /auth/register 本身) */
  skipRefresh?: boolean
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  try {
    const refresh = readRefreshToken()
    if (!refresh) return false
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })
    if (!res.ok) {
      writeTokens(null, null)
      return false
    }
    const data = await res.json()
    writeTokens(data.accessToken, refresh) // refresh token 不变
    return true
  } catch {
    return false
  }
}

function readRefreshToken(): string | null {
  try { return localStorage.getItem('feiman_auth_refresh') } catch { return null }
}
function writeTokens(access: string | null, refresh: string | null) {
  try {
    if (access) localStorage.setItem('feiman_auth_access', access)
    else localStorage.removeItem('feiman_auth_access')
    if (refresh) localStorage.setItem('feiman_auth_refresh', refresh)
    else localStorage.removeItem('feiman_auth_refresh')
  } catch { /* 静默 */ }
}

export async function apiFetch<T = unknown>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const access = getAccessToken()
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  }
  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  if (access && !headers.Authorization) {
    headers.Authorization = `Bearer ${access}`
  }

  let res = await fetch(url, { ...init, headers })

  // 401 自动 refresh + 重试
  if (res.status === 401 && !init.skipRefresh && !path.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = doRefresh()
    }
    const ok = await refreshPromise
    isRefreshing = false
    refreshPromise = null
    if (ok) {
      const newAccess = getAccessToken()
      if (newAccess) {
        headers.Authorization = `Bearer ${newAccess}`
        res = await fetch(url, { ...init, headers })
      }
    }
  }

  if (!res.ok) {
    let detail: unknown
    try { detail = await res.json() } catch { detail = await res.text() }
    throw new Error(`API ${res.status}: ${JSON.stringify(detail)}`)
  }
  return res.json() as Promise<T>
}

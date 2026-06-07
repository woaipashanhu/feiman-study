/**
 * ============================================================
 *  useAuth — 登录注册 hook
 *
 *  状态:
 *    user  当前用户(null = 未登录)
 *    accessToken / refreshToken  内存 + localStorage 双存
 *
 *  流程:
 *    - 启动时:从 localStorage 读 token,调 /api/auth/me 验证
 *    - 登录/注册成功后:存 token + 拉一次 /me
 *    - 登出:清 token + user
 *    - 401 时(apiClient 自动 refresh):成功后 user 仍然有效
 *
 *  localStorage keys:
 *    feiman_auth_access  access token
 *    feiman_auth_refresh refresh token
 * ============================================================
 */
import { useCallback, useEffect, useState } from 'react'

const API = '/api'

export interface AuthUser {
  id: string
  email: string | null
  phone: string | null
  nickname: string
  createdAt: number
  updatedAt: number
}

const STORAGE_ACCESS = 'feiman_auth_access'
const STORAGE_REFRESH = 'feiman_auth_refresh'

function readToken(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeToken(key: string, val: string | null) {
  try {
    if (val) localStorage.setItem(key, val)
    else localStorage.removeItem(key)
  } catch {
    // 静默
  }
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
}

let globalState: AuthState = {
  user: null,
  accessToken: readToken(STORAGE_ACCESS),
  refreshToken: readToken(STORAGE_REFRESH),
  loading: false,
  error: null,
}

const listeners = new Set<() => void>()

function setState(patch: Partial<AuthState>) {
  globalState = { ...globalState, ...patch }
  listeners.forEach((l) => l())
}

export function getAccessToken(): string | null {
  return globalState.accessToken
}

export function getCurrentAuthUser(): AuthUser | null {
  return globalState.user
}

export function useAuth() {
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force((v) => v + 1)
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])

  // 启动时:有 token 就 /me 验证
  useEffect(() => {
    if (!globalState.accessToken) return
    if (globalState.user) return
    ;(async () => {
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${globalState.accessToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          setState({ user: data.user })
        } else {
          // token 失效,清掉
          writeToken(STORAGE_ACCESS, null)
          writeToken(STORAGE_REFRESH, null)
          setState({ accessToken: null, refreshToken: null, user: null })
        }
      } catch {
        // 网络错,保持现状
      }
    })()
  }, [])

  const register = useCallback(
    async (email: string, password: string, nickname: string) => {
      setState({ loading: true, error: null })
      try {
        const res = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, nickname }),
        })
        const data = await res.json()
        if (!res.ok) {
          setState({ loading: false, error: data.message || '注册失败' })
          return false
        }
        writeToken(STORAGE_ACCESS, data.accessToken)
        writeToken(STORAGE_REFRESH, data.refreshToken)
        setState({
          loading: false,
          error: null,
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
        return true
      } catch (e) {
        setState({ loading: false, error: String(e) })
        return false
      }
    },
    []
  )

  const login = useCallback(async (email: string, password: string) => {
    setState({ loading: true, error: null })
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState({ loading: false, error: data.message || '登录失败' })
        return false
      }
      writeToken(STORAGE_ACCESS, data.accessToken)
      writeToken(STORAGE_REFRESH, data.refreshToken)
      setState({
        loading: false,
        error: null,
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      })
      return true
    } catch (e) {
      setState({ loading: false, error: String(e) })
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST' })
    } catch {
      // 静默
    }
    writeToken(STORAGE_ACCESS, null)
    writeToken(STORAGE_REFRESH, null)
    setState({ accessToken: null, refreshToken: null, user: null })
  }, [])

  return {
    user: globalState.user,
    accessToken: globalState.accessToken,
    loading: globalState.loading,
    error: globalState.error,
    isAuthenticated: !!globalState.user,
    register,
    login,
    logout,
  }
}

import { useState, useEffect, useCallback } from 'react'
import { validateContent, getFallbackContent, type ContentType } from '../utils/validator'

interface UseContentLoaderOptions<_T> {
  url: string
  type: ContentType
}

interface UseContentLoaderResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useContentLoader<T>({
  url,
  type,
}: UseContentLoaderOptions<T>): UseContentLoaderResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${url}?v=${Date.now()}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const json = await res.json()

      // Zod 校验
      const validated = validateContent<T>(type, json)

      if (validated.success) {
        setData(validated.data)
      } else {
        console.warn(`内容校验失败 [${type}]:`, validated.error)
        // 降级：使用默认空数据
        const fallback = getFallbackContent(type) as T
        setData(fallback)
        setError(`数据格式异常，已显示默认内容`)
      }
    } catch (err) {
      console.error('内容加载失败:', err)
      const errorMsg = err instanceof Error ? err.message : '加载失败'
      setError(errorMsg)
      // 降级
      const fallback = getFallbackContent(type) as T
      setData(fallback)
    } finally {
      setLoading(false)
    }
  }, [url, type])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 监听全局下拉刷新事件
  useEffect(() => {
    const handleRefresh = () => { fetchData() }
    window.addEventListener('feiman-refresh', handleRefresh)
    return () => window.removeEventListener('feiman-refresh', handleRefresh)
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

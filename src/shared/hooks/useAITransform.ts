/**
 * ============================================================
 *  useAITransform — AI 古文/英文转换 Hook
 *
 *  V1 调后端 POST /api/ai/transform
 *    - 后端优先用 LongCat API(env: LONGCAT_API_KEY)
 *    - 失败/超时/无 key → 后端降级 mock
 *    - 前端不直接拿 key(安全)
 *  V2 加: 流式响应、用户自定义风格、自定义温度
 * ============================================================
 */
import { useCallback, useState } from 'react'
import { apiFetch } from './apiClient'

export interface AITranslations {
  classicalChinese: string
  english: string
}

export type AISource = 'longcat' | 'mock' | 'unknown'

export interface UseAITransformResult {
  data: AITranslations | null
  source: AISource  // 后端实际用的来源
  loading: boolean
  error: string | null
  run: (input: string) => Promise<void>
  reset: () => void
}

interface TransformResponse {
  ok: boolean
  source: AISource
  classicalChinese: string
  english: string
}

export function useAITransform(): UseAITransformResult {
  const [data, setData] = useState<AITranslations | null>(null)
  const [source, setSource] = useState<AISource>('unknown')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (input: string) => {
    const text = input.trim()
    if (!text) {
      setError('请先输入内容')
      return
    }
    if (text.length < 2) {
      setError('内容太短,至少 2 个字')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<TransformResponse>('/ai/transform', {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      })
      setData({ classicalChinese: data.classicalChinese, english: data.english })
      setSource(data.source)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 转换失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return { data, source, loading, error, run, reset }
}

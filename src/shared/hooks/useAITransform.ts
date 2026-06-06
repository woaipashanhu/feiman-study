/**
 * ============================================================
 *  useAITransform — AI 古文/英文转换 Hook
 *
 *  V1 实现:mock(预置翻译模板 + 启发式匹配)
 *    - 不依赖外网
 *    - 不需要 API key
 *    - 演示效果完整
 *  V2 切换:把 mockClassical / mockEnglish 替换为真实 DeepSeek fetch
 *    (DeepSeek 中文古文最好最便宜)
 *  接口签名 V1 / V2 一致,组件代码零修改
 * ============================================================
 */
import { useCallback, useState } from 'react'

export interface AITranslations {
  classicalChinese: string
  english: string
}

export interface UseAITransformResult {
  data: AITranslations | null
  loading: boolean
  error: string | null
  run: (input: string) => Promise<void>
  reset: () => void
}

// ===== V1 mock 翻译(预置若干,启发式拼接) =====

/** 经典古文句式(随机抽 1-2 句 + 用户原文摘录) */
const CLASSICAL_TEMPLATES = [
  '{s}。古之学者必有师,师者所以传道受业解惑也。',
  '古人云:{s}。此言得之。',
  '夫{s},其义深远。',
  '学而时习之,不亦说乎?{s}。',
  '{s}——此理亘古不变也。',
  '吾辈当体悟:{s}。',
  '{s}。故君子日三省乎己。',
  '{s}。斯言诚哉!',
  '昔贤有言曰:{s}。吾深以为然。',
  '《礼记》有云:{s}。今人宜共勉之。',
]

/** 经典英文句式 */
const ENGLISH_TEMPLATES = [
  '"{s}" — a truth that echoes through the ages.',
  'Remember: {s}.',
  'It is often said that {s}.',
  'As one learns, {s}.',
  'To grow is to {s}.',
  'In every moment, {s}.',
  'The wise remind us: {s}.',
  'Let it be known that {s}.',
]

/** 简单启发式:从输入里抽前 1-2 句关键词 */
function extractKey(input: string): string {
  const t = input.trim()
  if (!t) return ''
  // 优先保留第一个句号前的部分
  const firstSentence = t.split(/[。!?\.\!\?]/)[0]?.trim() || t
  // 截断到 16 字内
  if (firstSentence.length > 16) return firstSentence.slice(0, 16) + '…'
  return firstSentence
}

/** V1 mock:生成"古文" */
function mockClassical(input: string): string {
  const key = extractKey(input) || '此心光明'
  const tpl = CLASSICAL_TEMPLATES[Math.floor(Math.random() * CLASSICAL_TEMPLATES.length)]
  return tpl.replace(/\{s\}/g, key)
}

/** V1 mock:生成"英文" */
function mockEnglish(input: string): string {
  const key = extractKey(input) || 'the heart stays bright'
  // 中文 → 拼音首字母兜底:V1 不做翻译,直接展示
  // 用占位英文模板,给用户视觉感受
  const tpl = ENGLISH_TEMPLATES[Math.floor(Math.random() * ENGLISH_TEMPLATES.length)]
  return tpl.replace(/\{s\}/g, key)
}

/**
 * 模拟网络延迟(800-1500ms)
 */
function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

/**
 * Hook
 */
export function useAITransform(): UseAITransformResult {
  const [data, setData] = useState<AITranslations | null>(null)
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
      // V1 mock:800-1500ms 延迟 + 生成
      await sleep(800 + Math.random() * 700)
      const result: AITranslations = {
        classicalChinese: mockClassical(text),
        english: mockEnglish(text),
      }
      setData(result)
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

  return { data, loading, error, run, reset }
}

// ============================================================
// V2 真实 DeepSeek 接口预留(暂时不导出,V2 启用)
// ============================================================
/*
const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_KEY = import.meta.env.VITE_DEEPSEEK_KEY as string | undefined

async function realAIFetch(input: string): Promise<AITranslations> {
  if (!DEEPSEEK_KEY) throw new Error('未配置 VITE_DEEPSEEK_KEY')
  const res = await fetch(DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一位古文/英文翻译助手。用户给一段中文,你输出 JSON:{classicalChinese, english}。古文要有书卷气,英文要简洁。',
        },
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  })
  const json = await res.json()
  const content = json.choices?.[0]?.message?.content || '{}'
  return JSON.parse(content)
}
*/

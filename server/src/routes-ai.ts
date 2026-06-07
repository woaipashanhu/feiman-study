/**
 * ============================================================
 *  /api/ai 路由 — AI 转换(古文 + 英文)
 *
 *  POST /api/ai/transform    { content: string } → { classicalChinese, english, source: 'longcat' | 'mock' }
 *
 *  行为:
 *    1. 优先用 LongCat API(OpenAI 兼容格式),环境变量 LONGCAT_API_KEY
 *    2. 失败/超时/无 key → 降级到 mock(预置模板)
 *    3. 前端无感(永远返回 200 + content)
 *
 *  安全:
 *    - key 只在服务端 env,前端永远不接触
 *    - 输入限长 2000 字
 *    - 5 秒超时(避免长卡)
 * ============================================================
 */
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { db } from './db.js'

export const aiRouter = Router()

const TransformBody = z.object({
  content: z.string().min(2).max(2000),
})

const LONGCAT_BASE = 'https://api.longcat.chat/openai/v1/chat/completions'
const LONGCAT_MODEL = 'LongCat-2.0-Preview'
const LONGCAT_TIMEOUT_MS = 5000

// =============== Mock 模板(降级用) ===============

const CLASSICAL_TEMPLATES = [
  '{s}——此言得之,甚善。',
  '古人云:{s}。今人宜共勉之。',
  '夫{s},其义深远。',
  '学而时习之,{s}。',
  '{s}。故君子日三省乎己。',
  '昔贤有言曰:{s}。',
  '{s}——斯言诚哉!',
  '吾辈当体悟:{s}。',
]

const ENGLISH_TEMPLATES = [
  '"It is often said that {s}."',
  'Remember: {s}.',
  'As one learns, {s}.',
  'The wise remind us: {s}.',
  'Let it be known that {s}.',
  'In every moment, {s}.',
  'To grow is to {s}.',
  'A simple truth: {s}.',
]

function extractKey(input: string): string {
  const t = input.trim()
  if (!t) return ''
  const firstSentence = t.split(/[。!?\.\!\?]/)[0]?.trim() || t
  if (firstSentence.length > 16) return firstSentence.slice(0, 16) + '…'
  return firstSentence
}

function mockTransform(input: string): { classicalChinese: string; english: string } {
  const key = extractKey(input) || '此心光明'
  const cTplIdx = Math.floor(Math.random() * CLASSICAL_TEMPLATES.length)
  const eTplIdx = Math.floor(Math.random() * ENGLISH_TEMPLATES.length)
  // noUncheckedIndexedAccess 兜底:用 ?? 默认值
  const cTpl = CLASSICAL_TEMPLATES[cTplIdx] ?? '{s}'
  const eTpl = ENGLISH_TEMPLATES[eTplIdx] ?? '"{s}"'
  return {
    classicalChinese: cTpl.replace(/\{s\}/g, key),
    english: eTpl.replace(/\{s\}/g, key),
  }
}

// =============== LongCat 调用 ===============

interface LongCatMsg {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface LongCatRequest {
  model: string
  messages: LongCatMsg[]
  max_tokens: number
  temperature: number
  response_format?: { type: 'json_object' | 'text' }
}

interface LongCatResponse {
  choices: { message: { content: string } }[]
}

async function longcatTransform(input: string, apiKey: string): Promise<{ classicalChinese: string; english: string }> {
  const sysPrompt =
    '你是一位文学翻译助手。用户给一段中文,你输出严格 JSON {classicalChinese, english}。' +
    '古文版本要有书卷气,像《论语》《道德经》风格,30-80 字;英文版本要简洁诗意,1-2 句。' +
    '只输出 JSON,不要任何额外说明。'

  const body: LongCatRequest = {
    model: LONGCAT_MODEL,
    messages: [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: input },
    ],
    max_tokens: 500,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LONGCAT_TIMEOUT_MS)

  try {
    const res = await fetch(LONGCAT_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`longcat HTTP ${res.status}`)
    }
    const data = (await res.json()) as LongCatResponse
    const content = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)
    return {
      classicalChinese: String(parsed.classicalChinese || '').trim() || '未能生成古文。',
      english: String(parsed.english || '').trim() || 'Translation unavailable.',
    }
  } finally {
    clearTimeout(timer)
  }
}

// =============== POST /api/ai/transform ===============

aiRouter.post('/transform', async (req: Request, res: Response) => {
  const parsed = TransformBody.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_body',
      message: '请求体不合法',
      details: parsed.error.issues,
    })
  }
  const { content } = parsed.data

  const apiKey = process.env.LONGCAT_API_KEY
  if (apiKey) {
    try {
      const result = await longcatTransform(content, apiKey)
      return res.json({
        ok: true,
        source: 'longcat',
        ...result,
      })
    } catch (e) {
      console.warn('[ai] longcat 调用失败,降级 mock:', String(e))
      // 降级到 mock,继续
    }
  } else {
    console.debug('[ai] 未设 LONGCAT_API_KEY,使用 mock')
  }

  // mock fallback
  const result = mockTransform(content)
  return res.json({
    ok: true,
    source: 'mock',
    ...result,
  })
})

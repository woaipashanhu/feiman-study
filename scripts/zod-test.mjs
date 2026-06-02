/**
 *  用实际的 Zod Schema 校验 social-scenes.json
 *  模拟浏览器端 useContentLoader 的完整流程
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// 动态 import zod
const { z } = await import('zod')

// === 复制 content.ts 中的 Schema 定义（完全一致）===
const BilingualText = z.union([z.string(), z.object({ zh: z.string(), en: z.string() })])

const ThoughtBubbleSchema = z.object({
  character: z.string(),
  characterColor: z.string(),
  text: BilingualText,
})

const StoryPartSchema = z.object({
  id: z.string(),
  audio: z.union([z.string(), z.object({ zh: z.string(), en: z.string() })]).optional(),
  image: z.string(),
  narration: BilingualText,
  thoughts: z.array(ThoughtBubbleSchema).optional(),
  tip: BilingualText.optional(),
  owlWisdom: BilingualText.optional(),
})

const SceneDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  principle: z.string(),
  difficulty: z.number(),
  characters: z.array(z.string()),
  parts: z.array(StoryPartSchema),
  summary: z.object({
    title: z.string(),
    message: z.string().optional(),
    socialSteps: z.array(z.string()),
  }),
})

const SceneCatalogEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  principle: z.string(),
  difficulty: z.number(),
  unlocked: z.boolean(),
  coverImage: z.string(),
})

const SocialDataSchema = z.object({
  version: z.string(),
  carnegieCatalog: z.array(SceneCatalogEntrySchema),
  socialStoryCatalog: z.array(SceneCatalogEntrySchema),
  sceneData: z.record(z.string(), SceneDataSchema),
})

// === 加载并校验 JSON ===
const jsonPath = join(ROOT, 'public/data/social-scenes.json')
const raw = readFileSync(jsonPath, 'utf-8')
const jsonData = JSON.parse(raw)

console.log('=== Zod Schema 校验测试 ===')
console.log(`JSON 大小: ${(raw.length / 1024).toFixed(0)}KB`)

const result = SocialDataSchema.safeParse(jsonData)

if (result.success) {
  console.log('✅ Zod 校验通过!')
  const d = result.data
  console.log(`  carnegieCatalog: ${d.carnegieCatalog.length}`)
  console.log(`  socialStoryCatalog: ${d.socialStoryCatalog.length}`)
  console.log(`  sceneData: ${Object.keys(d.sceneData).length}`)
} else {
  console.error(`❌ Zod 校验失败!`)
  console.error(`共 ${result.error.issues.length} 个错误:`)
  
  // 按路径分组统计
  const byPath = {}
  result.error.issues.forEach(issue => {
    const path = issue.path.join('.')
    if (!byPath[path]) byPath[path] = []
    byPath[path].push(issue.message)
  })
  
  Object.entries(byPath).forEach(([path, msgs]) => {
    console.error(`\n  📍 ${path} (${msgs.length}个错误):`)
    msgs.forEach(m => console.error(`     - ${m}`))
  })

  // 只显示前 30 个
  if (result.error.issues.length > 30) {
    console.error(`\n  ... 还有 ${result.error.issues.length - 30} 个错误未显示`)
  }
  
  // 显示前 20 个 issue 的详细信息
  console.error('\n--- 前 20 个详细错误 ---')
  result.error.issues.slice(0, 20).forEach((issue, i) => {
    console.error(`  [${i+1}] path=${issue.path.join('.')} code=${issue.code} msg=${issue.message}`)
    if (issue.path.length > 0) {
      // 尝试打印实际值
      try {
        let obj = jsonData
        for (const p of issue.path) {
          obj = obj[p]
        }
        const valStr = JSON.stringify(obj).substring(0, 100)
        console.error(`       实际值: ${valStr} (type: ${typeof obj})`)
      } catch(e) {}
    }
  })
}

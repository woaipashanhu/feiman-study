/**
 *  修复 social-scenes.json 中所有缺少前导 / 的路径
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const path = join(ROOT, 'public/data/social-scenes.json')

const raw = readFileSync(path, 'utf-8')
const data = JSON.parse(raw)

let fixedCount = 0

function fixPaths(obj) {
  if (typeof obj !== 'object' || obj === null) return
  
  if (Array.isArray(obj)) {
    obj.forEach(fixPaths)
    return
  }

  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && (v.startsWith('images/') || v.startsWith('audio/'))) {
      obj[k] = '/' + v
      fixedCount++
      // console.log(`  fix: ${v} → /${v}`)
    } else if (typeof v === 'object' && v !== null) {
      fixPaths(v)
    }
  }
}

fixPaths(data)

writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')

// 验证
const s = data.sceneData['social-01']
const p1 = s.parts[0]
console.log(`✅ 修复完成! 共修复 ${fixedCount} 个路径`)
console.log(`  sample image: ${p1.image}`)
console.log(`  sample audio.zh: ${p1.audio.zh}`)

// 检查是否还有遗漏
let remaining = 0
for (const [sid, scene] of Object.entries(data.sceneData)) {
  for (const part of scene.parts || []) {
    if (part.image && !part.image.startsWith('/') && (part.image.startsWith('images/') || part.image.startsWith('audio/'))) remaining++
    if (typeof part.audio === 'object') {
      for (const v of Object.values(part.audio)) {
        if (typeof v === 'string' && !v.startsWith('/') && (v.startsWith('images/') || v.startsWith('audio/'))) remaining++
      }
    }
  }
}
if (remaining > 0) console.warn(`⚠️ 还有 ${remaining} 个路径未修复`)
else console.log('✅ 所有路径已修复')

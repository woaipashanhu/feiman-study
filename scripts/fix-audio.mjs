/**
 * 修复 social-scenes.json 中非法的 audio: {} 空对象
 * Zod schema 要求 audio: string | { zh, en } | undefined
 * 但数据中有 219 个 audio: {} (空对象)，导致校验失败 → 整个社交列表降级为空
 */
import fs from 'fs'

const FILE = 'public/data/social-scenes.json'
const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'))

let fixedCount = 0

for (const [sceneId, scene] of Object.entries(data.sceneData)) {
  if (!scene?.parts) continue
  for (const part of scene.parts) {
    if (part.audio !== undefined && part.audio !== null) {
      const type = typeof part.audio
      // 允许: string | { zh, en }
      // 不允许: {} 空对象 | 其他
      if (type === 'object' && !Array.isArray(part.audio)) {
        const keys = Object.keys(part.audio)
        if (keys.length === 0 || (keys.length > 0 && typeof part.audio.zh !== 'string')) {
          // 空对象或没有 zh 字段 → 删除（转为 undefined）
          delete part.audio
          fixedCount++
        }
      }
    }
  }
}

// 写回
fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8')

console.log(`✅ 修复完成！共清理 ${fixedCount} 个非法 audio 字段`)
console.log(`文件已更新: ${FILE}`)

// 验证：再跑一次检查确认没有遗漏
let remaining = 0
for (const [, scene] of Object.entries(data.sceneData)) {
  if (!scene?.parts) continue
  for (const part of scene.parts) {
    if (part.audio !== undefined && part.audio !== null) {
      const type = typeof part.audio
      if (type === 'object' && !Array.isArray(part.audio)) {
        const keys = Object.keys(part.audio)
        if (keys.length === 0 || typeof part.audio.zh !== 'string') {
          remaining++
        }
      }
    }
  }
}
console.log(`剩余非法 audio: ${remaining}`)

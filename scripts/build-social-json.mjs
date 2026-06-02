/**
 *  ================================================================
 *   scenes.ts → social-scenes.json 一次性干净生成器
 *  
 *   策略：不解析 TS，不做 AST，不做 eval
 *   直接用正则把 scenes.ts 变成 .mjs 然后执行导出数据
 *  ================================================================
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, '../fox-school-ref/scenes.ts')
const OUT = join(ROOT, 'public/data/social-scenes.json')

const src = readFileSync(SRC, 'utf-8')
console.log(`[1/4] 读取源文件: ${(src.length / 1024).toFixed(0)}KB`)

// === 步骤1: 将 scenes.ts 转换为可执行的 .mjs ===
let mjs = src
  // 删除 import 行
  .replace(/^import\s+.*$/gm, '')
  // BASE 常量 → 直接定义为 '/'
  .replace(/const BASE:\s*string\s*=\s*import\.meta\.env\.BASE_URL\s*\|\|\s*['"]\/['"]/g, "const BASE = '/'")
  // 移除所有类型注解 (export const xxx: Type[] = → export const xxx =)
  .replace(/export const (\w+):\s*[^=\n]+=/g, 'export const $1 =')
  // Record<string, SceneData> → 移除
  .replace(/\s*: Record<[^>]+>/g, '')

// === 步骤2: 在末尾追加 JSON 序列化和写入逻辑 ===
mjs += `\n
import { writeFileSync as _w } from 'fs';
const _result = {
  version: '2026-05-30-v3-clean',
  title: '社交训练',
  description: '完整迁移自 fox-school 小狐狸学堂',
  carnegieCatalog: carnagieCatalog,
  socialStoryCatalog: socialStoryCatalog,
  sceneData: sceneData
};
_w('${OUT.replace(/\\/g, '/')}', JSON.stringify(_result, null, 2));
console.log('=== 输出统计 ===');
console.log('carnegieCatalog:', carnagieCatalog.length);
console.log('socialStoryCatalog:', socialStoryCatalog.length);
console.log('sceneData:', Object.keys(sceneData).length);
let _tp=0,_tt=0,_ta=0;
Object.values(sceneData).forEach(_s => {
  if(_s.parts) {
    _tp += _s.parts.length;
    _s.parts.forEach(_p => {
      if(_p.thoughts) _tt += _p.thoughts.length;
      if(_p.audio) _ta++;
    });
  }
});
console.log('totalParts:', _tp, '| totalThoughts:', _tt, '| partsWithAudio:', _ta);
`

// 写临时 .mjs 文件
const tmpMjs = join(ROOT, '/tmp/_build_social.mjs')
writeFileSync(tmpMjs, mjs, 'utf-8')
console.log(`[2/4] 生成可执行模块: ${tmpMjs}`)

// === 步骤3: 执行 ===
console.log(`[3/4] 执行转换...`)
try {
  execSync(`node "${tmpMjs}"`, {
    cwd: ROOT,
    stdio: 'inherit',
    timeout: 30000,
    env: { ...process.env }
  })
} catch (e) {
  console.error('❌ 执行失败!')
  // 输出前 30 行用于诊断
  console.error('\n--- 临时模块前30行 ---')
  console.error(mjs.split('\n').slice(0, 30).join('\n'))
  process.exit(1)
}

// === 步骤4: 后处理 — 确保所有路径以 / 开头 ===
console.log(`\n[4/4] 后处理路径格式...`)
const raw = readFileSync(OUT, 'utf-8')
const data = JSON.parse(raw)

let fixedCount = 0
function fixPaths(obj) {
  if (!obj || typeof obj !== 'object') return
  if (Array.isArray(obj)) { obj.forEach(fixPaths); return }
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && (v.startsWith('images/') || v.startsWith('audio/'))) {
      obj[k] = '/' + v
      fixedCount++
    } else if (typeof v === 'object' && v !== null) {
      fixPaths(v)
    }
  }
}
fixPaths(data)

writeFileSync(OUT, JSON.stringify(data, null, 2), 'utf-8')
console.log(`  修复了 ${fixedCount} 个路径`)

// 清理临时文件
try { const { unlinkSync } = await import('fs'); unlinkSync(tmpMjs) } catch {}

// === 最终验证 ===
const final = JSON.parse(readFileSync(OUT, 'utf-8'))
console.log(`\n✅ 最终输出:`)
console.log(`  文件: ${OUT}`)
console.log(`  大小: ${(readFileSync(OUT, 'utf-8').length / 1024).toFixed(0)} KB`)
console.log(`  keys: [${Object.keys(final).join(', ')}]`)
console.log(`  carnegieCatalog: ${final.carnegieCatalog?.length ?? 0}`)
console.log(`  socialStoryCatalog: ${final.socialStoryCatalog?.length ?? 0}`)
console.log(`  sceneData: ${final.sceneData ? Object.keys(final.sceneData).length : 0}`)

// 抽查
if (final.sceneData) {
  const keys = Object.keys(final.sceneData)
  const s = final.sceneData[keys[0]]
  console.log(`\n  📖 抽查 [${keys[0]}]: "${s.title}"`)
  console.log(`     parts: ${s.parts?.length ?? 0}`)
  if (s.parts?.[0]) {
    const p = s.parts[0]
    console.log(`     image: ${p.image}`)
    console.log(`     audio: ${JSON.stringify(p.audio)?.substring(0, 80)}`)
    console.log(`     thoughts: ${p.thoughts?.length ?? 0}`)
  }

  // 检查路径
  let badPaths = 0
  Object.values(final.sceneData).forEach(scene => {
    ;(scene.parts || []).forEach(part => {
      if (part.image && !part.image.startsWith('/')) badPaths++
      if (part.audio && typeof part.audio === 'object') {
        Object.values(part.audio).forEach(v => { if (typeof v === 'string' && !v.startsWith('/') && (v.includes('/') || v.includes('audio'))) badPaths++ })
      }
    })
  })
  if (badPaths > 0) console.warn(`  ⚠️ 还有 ${badPaths} 个异常路径!`)
  else console.log(`  ✅ 所有路径格式正确`)
}

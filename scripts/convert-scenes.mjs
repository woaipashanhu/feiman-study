/**
 *  scenes.ts → social-scenes.json 转换脚本 v4
 *  直接改造 scenes.ts 为可执行 .mjs 模块并运行
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const srcPath = join(ROOT, '../fox-school-ref/scenes.ts')
const outPath = join(ROOT, 'public/data/social-scenes.json')

let src = readFileSync(srcPath, 'utf-8')
console.log(`[1/4] 读取源文件: ${(src.length / 1024).toFixed(0)}KB`)

// 改造 TS 为可执行的 ESM 模块
let moduleCode = src
  // 移除 import 行
  .replace(/^import\s+.*$/gm, '')
  // BASE 常量定义
  .replace(/const BASE:\s*string\s*=\s*import\.meta\.env\.BASE_URL\s*\|\|\s*['"]\/['"]/g, "const BASE = '/'")
  // 移除所有类型注解
  .replace(/export const (\w+):\s*[^=\n]+=/g, 'export const $1 =')
  .replace(/: Record<[^>]+>/g, ': SceneCatalogEntry[]', '') // 这个不需要了
  .replace(/: Record<[^>]+>/g, '')
  // 在末尾添加输出逻辑（使用 import 的方式）
  + `

// === 输出 JSON ===
import { writeFileSync as _wfs } from 'fs';
const _out = {
  version: '2026-05-30-v2-migrated',
  title: '社交训练',
  description: '完整迁移自 fox-school (小狐狸学堂)',
  carnegieCatalog,
  socialStoryCatalog,
  sceneData
};
_wfs('${outPath.replace(/\\/g, '/')}', JSON.stringify(_out, null, 2));
console.log('✅ JSON 写入成功');
console.log('carnegie:', carnegieCatalog.length, '| socialStory:', socialStoryCatalog.length, '| scenes:', Object.keys(sceneData).length);
let _tp=0,_tt=0;
Object.values(sceneData).forEach(s=>{ if(s.parts){ _tp+=s.parts.length; s.parts.forEach(p=>{if(p.thoughts)_tt+=p.thoughts.length}) }});
console.log('parts:',_tp,'thoughts:',_tt);
`

const tmpPath = join(ROOT, 'scripts/_convert_tmp.mjs')
writeFileSync(tmpPath, moduleCode, 'utf-8')

console.log(`[2/4] 执行转换模块...`)

try {
  execSync(`node "${tmpPath}"`, {
    cwd: ROOT,
    stdio: 'inherit',
    timeout: 30000,
    env: { ...process.env }
  })
} catch (e) {
  console.error('❌ 执行失败')
  console.error(e.message?.substring(0, 500))
  
  // 输出临时文件前 30 行用于诊断
  const tmpContent = readFileSync(tmpPath, 'utf-8')
  console.error('\n--- 临时文件前20行 ---')
  console.error(tmpContent.split('\n').slice(0, 20).join('\n'))
}

// 验证
console.log(`\n[3/4] 验证输出...`)
const result = JSON.parse(readFileSync(outPath, 'utf-8'))
const cc = result.carnegieCatalog?.length ?? 0
const sc = result.socialStoryCatalog?.length ?? 0
const sd = result.sceneData ? Object.keys(result.sceneData).length : 0

console.log(`  ✅ carnegieCatalog: ${cc}`)
console.log(`  ✅ socialStoryCatalog: ${sc}`)
console.log(`  ✅ sceneData: ${sd}`)

const sample = result.sceneData?.['social-01']
if (sample?.parts?.[0]) {
  console.log(`\n[4/4] 📖 sample social-01 "${sample.title}":`)
  console.log(`  parts: ${sample.parts.length}`)
  const p1 = sample.parts[0]
  console.log(`  p1.image: ${p1.image}`)
  console.log(`  p1.audio: ${typeof p1.audio === 'object' ? 'bilingual ✅' : p1.audio ? 'string ✅' : '❌ none'}`)
  console.log(`  p1.thoughts: ${p1.thoughts?.length ?? 0}`)
  console.log(`  p1.narration: ${typeof p1.narration === 'object' ? 'bilingual ✅' : 'string ✅'}`)
}

// 清理
try { const { unlinkSync } = await import('fs'); unlinkSync(tmpPath) } catch {}

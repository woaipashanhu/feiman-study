/**
 *  远程验证 + 本地验证 social-scenes.json
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PEM = '/Users/liuzhen/Desktop/项目/CLAW.PEM'
const HOST = 'root@47.99.101.168'
const REMOTE_PATH = '/var/www/feiman-v3-new/data/social-scenes.json'

// === 1. 远程 JSON 结构检查 ===
console.log('=== 1. 远程 JSON 结构检查 ===')
const remoteCheck = execSync(
  `ssh -i ${PEM} ${HOST} "python3 -c \\\"import json;d=json.load(open('${REMOTE_PATH}'));print('keys:',list(d.keys()));print('version:',d.get('version'));print('cc:',len(d.get('carnegieCatalog',[])));print('sc:',len(d.get('socialStoryCatalog',[])));print('sd:',len(d.get('sceneData',{})));cc=d.get('carnegieCatalog',[]);print('cc[0]:',json.dumps(cc[0],ensure_ascii=False) if cc else 'EMPTY');sd=d.get('sceneData',{});ks=list(sd.keys());print('sd_keys[:3]:',ks[:3]);s=sd[ks[0]] if ks else {};print('s_keys:',list(s.keys()) if s else {});print('s_parts:',len(s.get('parts',[])) if s else 0);p=s['parts'][0] if s and s.get('parts') else {};print('p_image:',p.get('image','NONE') if p else 'NONE');print('p_audio_type:',type(p.get('audio')).__name__ if p else 'NONE')\\\""`,
  { encoding: 'utf-8', timeout: 10000 }
)
console.log(remoteCheck)

// === 2. 本地 JSON 结构检查 ===
console.log('\n=== 2. 本地 JSON 结构检查 ===')
const localPath = join(ROOT, 'public/data/social-scenes.json')
const localRaw = readFileSync(localPath, 'utf-8')
const localData = JSON.parse(localRaw)

console.log('Top keys:', Object.keys(localData))
console.log('version:', localData.version)
console.log('carnegieCatalog:', localData.carnegieCatalog?.length ?? 0)
console.log('socialStoryCatalog:', localData.socialStoryCatalog?.length ?? 0)
console.log('sceneData:', localData.sceneData ? Object.keys(localData.sceneData).length : 0)

// 检查 carnegieCatalog 第一个条目的字段
if (localData.carnegieCatalog?.[0]) {
  const c0 = localData.carnegieCatalog[0]
  console.log('\ncarnegieCatalog[0]:', JSON.stringify(c0).substring(0, 200))
}

// 检查 sceneData 第一个场景
const sdKeys = localData.sceneData ? Object.keys(localData.sceneData) : []
console.log('\nsceneData first 5 keys:', sdKeys.slice(0, 5))

if (sdKeys.length > 0) {
  const s0 = localData.sceneData[sdKeys[0]]
  console.log('scene keys:', Object.keys(s0))
  console.log('title:', s0.title)
  console.log('parts count:', s0.parts?.length ?? 0)
  
  if (s0.parts?.[0]) {
    const p1 = s0.parts[0]
    console.log('\npart1 keys:', Object.keys(p1))
    console.log('part1.image:', p1.image)
    console.log('part1.audio:', typeof p1.audio === 'object' ? JSON.stringify(p1.audio).substring(0, 100) : p1.audio)
    console.log('part1.narration:', typeof p1.narration === 'object' ? 'bilingual ✅' : p1.narration?.substring(0, 80))
    console.log('part1.thoughts count:', p1.thoughts?.length ?? 0)
  }
  
  // 检查 summary
  console.log('\nsummary:', JSON.stringify(s0.summary).substring(0, 200))
}

// === 3. 关键：模拟 Zod 校验 ===
console.log('\n=== 3. Zod Schema 兼容性预检 ===')

// 检查每个 carnegieCatalog 条目是否有 coverImage（Zod 要求 string）
let coverIssues = []
;(localData.carnegieCatalog ?? []).forEach((c, i) => {
  if (typeof c.coverImage !== 'string') coverIssues.push(`carnegie[${i}] id=${c.id} coverImage=${typeof c.coverImage}`)
})
if (coverIssues.length > 0) {
  console.warn('⚠️ coverImage 问题:')
  coverIssues.forEach(x => console.warn('  ', x))
} else {
  console.log('✅ 所有 carnegieCatalog 条目都有 coverImage (string)')
}

// 检查 sceneData 中每个场景的必要字段
let sceneIssues = []
Object.entries(localData.sceneData ?? {}).forEach(([id, scene]) => {
  if (!scene.parts || !Array.isArray(scene.parts) || scene.parts.length === 0) {
    sceneIssues.push(`${id}: 无 parts`)
  }
  if (!scene.summary || typeof scene.summary !== 'object') {
    sceneIssues.push(`${id}: summary 缺失或非对象`)
  }
  if (!scene.characters || !Array.isArray(scene.characters)) {
    sceneIssues.push(`${id}: characters 缺失或非数组`)
  }
})
if (sceneIssues.length > 0) {
  console.warn(`⚠️ ${sceneIssues.length} 个场景有问题:`)
  sceneIssues.slice(0, 10).forEach(x => console.warn('  ', x))
} else {
  console.log('✅ 所有必要字段齐全')
}

// === 4. 路径格式最终确认 ===
console.log('\n=== 4. 路径格式抽样 ===')
let badPaths = []
Object.values(localData.sceneData ?? {}).forEach((scene, si) => {
  ;(scene.parts ?? []).forEach((part, pi) => {
    const img = part.image ?? ''
    if (img && !img.startsWith('/')) badPaths.push(`image [${si}:${pi}] ${img}`)
    if (typeof part.audio === 'object' && part.audio) {
      ;['zh', 'en'].forEach(lang => {
        if (part.audio[lang] && !part.audio[lang].startsWith('/')) {
          badPaths.push(`audio.${lang} [${si}:${pi}] ${part.audio[lang]}`)
        }
      })
    } else if (typeof part.audio === 'string' && part.audio && !part.audio.startsWith('/')) {
      badPaths.push(`audio(string) [${si}:${pi}] ${part.audio}`)
    }
  })
})
if (badPaths.length > 0) {
  console.error(`❌ ${badPaths.length} 个路径缺少前导 /:`)
  badPaths.slice(0, 10).forEach(x => console.error('  ', x))
} else {
  console.log('✅ 所有路径格式正确')
}

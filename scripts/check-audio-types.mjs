import fs from 'fs'

const data = JSON.parse(fs.readFileSync('public/data/social-scenes.json', 'utf-8'))

const badEntries = []

for (const [sceneId, scene] of Object.entries(data.sceneData)) {
  if (!scene?.parts) continue
  for (let i = 0; i < scene.parts.length; i++) {
    const part = scene.parts[i]
    const audio = part.audio
    // Zod 要求: string | { zh, en } | undefined
    // 检查非法类型
    if (audio !== undefined && audio !== null) {
      const type = typeof audio
      if (type === 'string') continue
      if (type === 'object' && !Array.isArray(audio) && typeof audio.zh === 'string' && typeof audio.en === 'string') continue

      // 不合法！
      badEntries.push({
        sceneId,
        partIndex: i,
        partId: part.id,
        audioType: type,
        audioValue: JSON.stringify(audio)?.substring(0, 120),
        isArray: Array.isArray(audio),
      })
    }
  }
}

console.log(`=== 非法 audio 字段检查 ===`)
console.log(`总场景数: ${Object.keys(data.sceneData).length}`)
console.log(`非法 audio 数量: ${badEntries.length}`)

if (badEntries.length > 0) {
  console.log('\n前 20 条非法记录:')
  badEntries.slice(0, 20).forEach(b => {
    console.log(`  ${b.sceneId} / part[${b.partIndex}] (${b.partId})`)
    console.log(`    type=${b.audioType} isArray=${b.isArray}`)
    console.log(`    value= ${b.audioValue}`)
  })
} else {
  console.log('\n✅ 所有 audio 字段都合法')
}

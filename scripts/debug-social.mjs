import fs from 'fs'

const data = JSON.parse(fs.readFileSync('public/data/social-scenes.json', 'utf-8'))

console.log('=== social-scenes.json 数据检查 ===')
console.log('carnegieCatalog 数量:', data.carnegieCatalog?.length)
console.log('socialStoryCatalog 数量:', data.socialStoryCatalog?.length)
console.log('sceneData keys 数量:', Object.keys(data.sceneData || {}).length)

const lockedCarnegie = data.carnegieCatalog?.filter(s => !s.unlocked).length
const lockedSocial = data.socialStoryCatalog?.filter(s => !s.unlocked).length
console.log('carnegie 锁定数量(不可见):', lockedCarnegie)
console.log('socialStory 锁定数量(不可见):', lockedSocial)

// 检查前几条
console.log('\n前3条 carnegie:')
data.carnegieCatalog?.slice(0,3).forEach(s => console.log(' ', s.id, s.title, 'unlocked:', s.unlocked))

console.log('\n前3条 socialStory:')
data.socialStoryCatalog?.slice(0,3).forEach(s => console.log(' ', s.id, s.title, 'unlocked:', s.unlocked))

// 文件大小
const stat = fs.statSync('public/data/social-scenes.json')
console.log('\n文件大小:', (stat.size / 1024).toFixed(1), 'KB')

// 部署后的 dist 中也有吗?
try {
  const distData = JSON.parse(fs.readFileSync('dist/data/social-scenes.json', 'utf-8'))
  console.log('\ndist/data/social-scenes.json:')
  console.log('  carnegie:', distData.carnegieCatalog?.length)
  console.log('  socialStory:', distData.socialStoryCatalog?.length)
} catch(e) {
  console.log('\ndist/data/social-scenes.json 不存在或读取失败:', e.message)
}

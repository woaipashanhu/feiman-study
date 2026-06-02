// 读取当前 JSON，移除没有资源的场景
const fs_data = await fetch('http://47.99.101.168:8890/data/social-scenes.json').then(r => r.json());
const BASE = 'http://47.99.101.168:8890';

let keptScenes = 0;
let removedScenes = 0;
const newSceneData = {};
const newCarnegieCatalog = [];
const newSocialStoryCatalog = [];

async function checkImage(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    const ct = r.headers.get('content-type') || '';
    return ct.startsWith('image/');
  } catch(e) { return false; }
}

async function checkAudio(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    const ct = r.headers.get('content-type') || '';
    return ct.startsWith('audio/');
  } catch(e) { return false; }
}

console.log('检查每个场景的资源...\n');

for (const [sid, scene] of Object.entries(fs_data.sceneData || {})) {
  // 检查第一个 part 的图片是否存在
  const firstImg = scene.parts?.[0]?.image;
  if (!firstImg) { removedScenes++; console.log(`  ❌ ${sid}: 无图片`); continue; }

  const imgOk = await checkImage(BASE + firstImg);
  
  if (!imgOk) {
    removedScenes++;
    console.log(`  ❌ ${sid} (${scene.title}): 缺图片 ${firstImg}`);
    continue;
  }

  // 保留这个场景
  newSceneData[sid] = scene;
  keptScenes++;

  // 同时更新 catalog
  const carnegieItem = fs_data.carnegieCatalog?.find(c => c.id === sid);
  if (carnegieItem) newCarnegieCatalog.push(carnegieItem);
  const socialItem = fs_data.socialStoryCatalog?.find(c => c.id === sid);
  if (socialItem) newSocialStoryCatalog.push(socialItem);
}

const newData = {
  ...fs_data,
  carnegieCatalog: newCarnegieCatalog,
  socialStoryCatalog: newSocialStoryCatalog,
  sceneData: newSceneData,
};

console.log(`\n========== 结果 ==========`);
console.log(`✅ 保留: ${keptScenes} 个场景`);
console.log(`❌ 移除: ${removedScenes} 个场景（缺资源）`);

// 写到本地文件
import { writeFileSync } from 'fs';
const outPath = '/Users/liuzhen/Documents/lingxi-claw/20260529-08-47-11-713/feiman-v3-new/public/data/social-scenes.json';
writeFileSync(outPath, JSON.stringify(newData, null, 2));
console.log(`\n已写入: ${outPath}`);
console.log(`文件大小: ${(JSON.stringify(newData).length / 1024).toFixed(1)} KB`);

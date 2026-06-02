// 检查每个场景的图片和音频是否存在
const fs = await fetch('http://47.99.101.168:8890/data/social-scenes.json').then(r => r.json());

const BASE = 'http://47.99.101.168:8890';
let okScenes = 0;
let missingImgScenes = 0;
let missingAudScenes = 0;
const details = [];

for (const [sid, scene] of Object.entries(fs.sceneData || {})) {
  const imgs = [];
  const auds = [];
  let hasMissingImg = false;
  let missingAud = false;

  for (const part of (scene.parts || [])) {
    if (part.image) {
      const url = BASE + part.image;
      try {
        const r = await fetch(url, { method: 'HEAD' });
        const ct = r.headers.get('content-type') || '';
        if (!ct.startsWith('image/')) { hasMissingImg = true; imgs.push(`❌ ${part.image} (${ct})`); }
        else imgs.push(`✅ ${part.image}`);
      } catch(e) { hasMissingImg = true; imgs.push(`❌ ${part.image} (err)`); }
    }

    const aud = part.audio;
    if (typeof aud === 'string' && aud) {
      const url = BASE + aud;
      try {
        const r = await fetch(url, { method: 'HEAD' });
        const ct = r.headers.get('content-type') || '';
        if (!ct.startsWith('audio/')) { missingAud = true; auds.push(`❌ ${aud} (${ct})`); }
        else auds.push(`✅ ${aud}`);
      } catch(e) { missingAud = true; auds.push(`❌ ${aud} (err)`); }
    } else if (typeof aud === 'object') {
      for (const [k, v] of Object.entries(aud)) {
        if (v) {
          const url = BASE + v;
          try {
            const r = await fetch(url, { method: 'HEAD' });
            const ct = r.headers.get('content-type') || '';
            if (!ct.startsWith('audio/')) { missingAud = true; auds.push(`❌ ${v} (${ct})`); }
            else auds.push(`✅ ${v}`);
          } catch(e) { missingAud = true; auds.push(`❌ ${v} (err)`); }
        }
      }
    }
  }

  // 封面图
  const catalog = [...(fs.carnegieCatalog || []), ...(fs.socialStoryCatalog || [])].find(c => c.id === sid);
  if (catalog?.coverImage) {
    const url = BASE + catalog.coverImage;
    try {
      const r = await fetch(url, { method: 'HEAD' });
      const ct = r.headers.get('content-type') || '';
      if (!ct.startsWith('image/')) { hasMissingImg = true; imgs.unshift(`❌ cover: ${catalog.coverImage} (${ct})`); }
      else imgs.unshift(`✅ cover: ${catalog.coverImage}`);
    } catch(e) { hasMissingImg = true; imgs.unshift(`❌ cover: ${catalog.coverImage}`); }
  }

  if (hasMissingImg) missingImgScenes++;
  else okScenes++;
  if (missingAud) missingAudScenes++;

  if (hasMissingImg || missingAud) {
    details.push({ id: sid, title: scene.title, imgs, auds });
  }
}

console.log(`\n========== 资源检查报告 ==========`);
console.log(`总场景数: ${Object.keys(fs.sceneData).length}`);
console.log(`✅ 图片完整: ${okScenes}`);
console.log(`❌ 缺图片:   ${missingImgScenes}`);
console.log(`❌ 缺音频:   ${missingAudScenes}`);

console.log(`\n========== 缺失资源的场景（前20个）==========`);
for (const d of details.slice(0, 20)) {
  console.log(`\n--- ${d.id}: ${d.title} ---`);
  d.imgs.forEach(i => console.log(`  ${i}`));
  d.auds.forEach(a => console.log(`  ${a}`));
}
if (details.length > 20) console.log(`\n... 还有 ${details.length - 20} 个场景缺失资源`);

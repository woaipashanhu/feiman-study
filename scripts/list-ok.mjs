const fs = await fetch('http://47.99.101.168:8890/data/social-scenes.json').then(r => r.json());
const BASE = 'http://47.99.101.168:8890';
let ok = [];
for (const [sid, scene] of Object.entries(fs.sceneData || {})) {
  const img = scene.parts?.[0]?.image;
  if (!img) continue;
  try {
    const r = await fetch(BASE + img, { method: 'HEAD' });
    const ct = r.headers.get('content-type') || '';
    if (ct.startsWith('image/')) ok.push({ id: sid, title: scene.title, firstImg: img });
  } catch(e) {}
}
console.log('=== 可正常显示图片的场景 ===');
ok.forEach(s => console.log(`  ✅ ${s.id}: ${s.title}`));
console.log(`\n共 ${ok.length} 个场景有资源 / ${Object.keys(fs.sceneData).length} 个总场景`);

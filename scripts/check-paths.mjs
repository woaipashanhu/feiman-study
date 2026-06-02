// 检查 JSON 中引用的所有路径 vs 服务器实际文件
const fs = await fetch('http://47.99.101.168:8890/data/social-scenes.json').then(r => r.json());

const imagePaths = new Set();
const audioPaths = new Set();

for (const [sid, scene] of Object.entries(fs.sceneData || {})) {
  for (const part of (scene.parts || [])) {
    if (part.image) imagePaths.add(part.image);
    const aud = part.audio;
    if (typeof aud === 'string' && aud) audioPaths.add(aud);
    else if (typeof aud === 'object') {
      for (const v of Object.values(aud)) if (v) audioPaths.add(v);
    }
  }
}
for (const item of [...(fs.carnegieCatalog || []), ...(fs.socialStoryCatalog || [])]) {
  if (item.coverImage) imagePaths.add(item.coverImage);
}

console.log(`唯一图片路径: ${imagePaths.size}`);
console.log(`唯一音频路径: ${audioPaths.size}`);

// 按目录分组
const imgDirs = {};
const audDirs = {};
for (const p of imagePaths) {
  const dir = p.substring(0, p.lastIndexOf('/'));
  imgDirs[dir] = (imgDirs[dir] || 0) + 1;
}
for (const p of audioPaths) {
  const dir = p.substring(0, p.lastIndexOf('/'));
  audDirs[dir] = (audDirs[dir] || 0) + 1;
}

console.log('\n--- 图片按目录 ---');
for (const [k, v] of Object.entries(imgDirs).sort()) console.log(`  ${k}/ : ${v} files`);
console.log('\n--- 音频按目录 ---');
for (const [k, v] of Object.entries(audDirs).sort()) console.log(`  ${k}/ : ${v} files`);

console.log('\n--- 所有图片路径前50个 ---');
[...imagePaths].slice(0, 50).forEach(p => console.log(`  ${p}`));
if (imagePaths.size > 50) console.log(`  ... 还有 ${imagePaths.size - 50} 个`);

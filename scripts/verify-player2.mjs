import puppeteer from 'puppeteer';

const URL = 'http://47.99.101.168:8890';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

const logs = [];
const errors = [];
page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warn') logs.push(`[${msg.type()}] ${msg.text()}`); });
page.on('pageerror', err => errors.push(err.message));
await page.setCacheEnabled(false);

// Step 1: Open first scene (carnegie - s09)
console.log('=== Scene 1: s09 (Carnegie, 6 parts) ===');
await page.goto(`${URL}/social/scene/s09`, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));

const info1 = await page.evaluate(() => {
  const playBtn = document.querySelector('button[title="播放"], button[title="暂停"]');
  const imgs = Array.from(document.querySelectorAll('img')).map(i => i.src).filter(s => !s.includes('data:') && !s.includes('svg'));
  const narr = document.querySelector('p');
  return {
    playBtnTitle: playBtn?.getAttribute('title'),
    imageCount: imgs.length,
    firstImg: imgs[0]?.slice(0, 80),
    narration: narr?.textContent?.slice(0, 100),
    allBtnTitles: Array.from(document.querySelectorAll('button')).map(b => b.getAttribute('title') || b.textContent?.trim()).filter(Boolean),
  };
});
console.log(JSON.stringify(info1, null, 2));

// Click pause
await page.evaluate(() => {
  const btn = document.querySelector('button[title="暂停"]');
  if (btn) btn.click();
});
await new Promise(r => setTimeout(r, 500));
const afterPause = await page.evaluate(() => document.querySelector('button[title="播放"], button[title="暂停"]')?.getAttribute('title'));
console.log('After pause click:', afterPause);

// Click play again
await page.evaluate(() => {
  const btn = document.querySelector('button[title="播放"]');
  if (btn) btn.click();
});
await new Promise(r => setTimeout(r, 500));
const afterPlay = await page.evaluate(() => document.querySelector('button[title="播放"], button[title="暂停"]')?.getAttribute('title'));
console.log('After play click:', afterPlay);

// Step 2: Navigate to second scene
console.log('\n=== Scene 2: s10 ===');
await page.goto(`${URL}/social/scene/s10`, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));

const info2 = await page.evaluate(() => {
  const playBtn = document.querySelector('button[title="播放"], button[title="暂停"]');
  const imgs = Array.from(document.querySelectorAll('img')).map(i => i.src).filter(s => !s.includes('data:') && !s.includes('svg'));
  return {
    playBtnTitle: playBtn?.getAttribute('title'),
    imageCount: imgs.length,
    firstImg: imgs[0]?.slice(0, 80),
  };
});
console.log(JSON.stringify(info2, null, 2));

// Click play on second scene
await page.evaluate(() => {
  const btn = document.querySelector('button[title="播放"], button[title="暂停"]');
  if (btn) btn.click();
});
await new Promise(r => setTimeout(r, 500));
const afterPlay2 = await page.evaluate(() => document.querySelector('button[title="播放"], button[title="暂停"]')?.getAttribute('title'));
console.log('After play on scene 2:', afterPlay2);

// Try clicking play AGAIN (the bug scenario)
await page.evaluate(() => {
  const btn = document.querySelector('button[title="暂停"]');
  if (btn) btn.click(); // pause
});
await new Promise(r => setTimeout(r, 500));
await page.evaluate(() => {
  const btn = document.querySelector('button[title="播放"]');
  if (btn) btn.click(); // play again
});
await new Promise(r => setTimeout(r, 500));
const afterReplay = await page.evaluate(() => document.querySelector('button[title="播放"], button[title="暂停"]')?.getAttribute('title'));
console.log('After replay on scene 2:', afterReplay);

// Step 3: Test EN toggle
console.log('\n=== EN Toggle Test ===');
const enResult = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => {
    const t = b.textContent?.trim();
    return t === 'EN' || t === '中';
  });
  if (!btn) return { error: 'EN button not found' };
  const before = btn.textContent.trim();
  btn.click();
  const after = btn.textContent.trim();
  // Get narration text
  const narr = document.querySelector('p.text-\\[12px\\]') || document.querySelector('.overflow-y-auto p');
  return { before, after, narration: narr?.textContent?.slice(0, 150) || 'not found' };
});
console.log(JSON.stringify(enResult, null, 2));

// Step 4: Test a social story (3 parts)
console.log('\n=== Scene 3: s-01 (Social Story, 3 parts) ===');
await page.goto(`${URL}/social/scene/s-01`, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));

const info3 = await page.evaluate(() => {
  const playBtn = document.querySelector('button[title="播放"], button[title="暂停"]');
  const imgs = Array.from(document.querySelectorAll('img')).map(i => i.src).filter(s => !s.includes('data:') && !s.includes('svg'));
  return {
    playBtnTitle: playBtn?.getAttribute('title'),
    imageCount: imgs.length,
    firstImg: imgs[0]?.slice(0, 80),
  };
});
console.log(JSON.stringify(info3, null, 2));

// Summary
console.log('\n=== Console Warnings/Errors ===');
logs.forEach(l => console.log(' ', l.slice(0, 200)));
if (errors.length) errors.forEach(e => console.log(' ERROR:', e));
else console.log('✅ No errors!');

await browser.close();

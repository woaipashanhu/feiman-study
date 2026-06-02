import puppeteer from 'puppeteer';

const URL = 'http://47.99.101.168:8890';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const logs = [];
page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warn') logs.push(msg.text().slice(0, 200)); });
await page.setCacheEnabled(false);

// Test 1: List page
console.log('=== 1. List Page ===');
await page.goto(`${URL}/social`, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));
const listInfo = await page.evaluate(() => document.body?.innerText?.match(/(\d+)\/\d+/)?.[0] || 'no match');
console.log('Carnegie count:', listInfo);
console.log('Warnings:', logs.length);

// Test 2: Scene with EN (s16)
console.log('\n=== 2. s16 Player + EN Toggle ===');
await page.goto(`${URL}/social/scene/s16`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise(r => setTimeout(r, 3000));

const beforeEN = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'EN' || b.textContent.trim() === '中');
  const narr = document.querySelector('p');
  return {
    btnText: btn?.textContent?.trim(),
    narration: narr?.textContent?.slice(0, 100),
    playBtn: document.querySelector('button[title="播放"], button[title="暂停"]')?.getAttribute('title'),
  };
});
console.log('Before toggle:', JSON.stringify(beforeEN));

// Click EN
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'EN');
  if (btn) btn.click();
});
await new Promise(r => setTimeout(r, 500));

const afterEN = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('EN') || b.textContent.includes('中'));
  const narr = document.querySelector('p');
  return {
    btnText: btn?.textContent?.trim(),
    narration: narr?.textContent?.slice(0, 150),
  };
});
console.log('After EN toggle:', JSON.stringify(afterEN));

// Test 3: Play/Pause on s16
console.log('\n=== 3. Play/Pause Cycle ===');
for (let i = 0; i < 3; i++) {
  const title = await page.evaluate(() => {
    const btn = document.querySelector('button[title="播放"], button[title="暂停"]');
    if (btn) { btn.click(); return btn.getAttribute('title'); }
    return null;
  });
  console.log(`  Click ${i+1}: was "${title}"`);
  await new Promise(r => setTimeout(r, 300));
}

// Test 4: Switch to another scene and test play
console.log('\n=== 4. Scene Switch (s16 -> s17) ===');
await page.goto(`${URL}/social/scene/s17`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise(r => setTimeout(r, 3000));

const s17info = await page.evaluate(() => ({
  playBtn: document.querySelector('button[title="播放"], button[title="暂停"]')?.getAttribute('title'),
  hasImg: !!document.querySelector('img[src*="images"]'),
}));
console.log('s17:', JSON.stringify(s17info));

// Click play on s17
await page.evaluate(() => { const b = document.querySelector('button[title="播放"], button[title="暂停"]'); if (b) b.click(); });
await new Promise(r => setTimeout(r, 500));
const s17after = await page.evaluate(() => document.querySelector('button[title="播放"], button[title="暂停"]')?.getAttribute('title'));
console.log('s17 after click:', s17after);

// Click play again
await page.evaluate(() => { const b = document.querySelector('button[title="播放"], button[title="暂停"]'); if (b) b.click(); });
await new Promise(r => setTimeout(r, 500));
const s17after2 = await page.evaluate(() => document.querySelector('button[title="播放"], button[title="暂停"]')?.getAttribute('title'));
console.log('s17 after 2nd click:', s17after2);

// Summary
console.log('\n=== Final ===');
if (logs.length > 0) {
  console.log('Warnings/Errors:');
  logs.forEach(l => console.log(' ', l));
} else {
  console.log('All clear!');
}

await browser.close();

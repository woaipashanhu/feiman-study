import puppeteer from 'puppeteer';

const URL = 'http://47.99.101.168:8890';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

const logs = [];
const errors = [];
page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warn') logs.push(`[${msg.type()}] ${msg.text()}`); });
page.on('pageerror', err => errors.push(err.message));

// Step 1: Go to list page
console.log('=== Step 1: List Page ===');
await page.goto(`${URL}/social`, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));

const carnegieCount = await page.evaluate(() => {
  const items = document.querySelectorAll('[class*="carnegie"] [class*="card"], .carnegie-card, [data-type="carnegie"]');
  // Try to count from the actual rendered content
  const allCards = document.querySelectorAll('.grid > a, [class*="grid"] > *');
  return allCards.length;
});
console.log(`List page loaded. Cards visible: ${carnegieCount}`);

// Get all scene links
const sceneLinks = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href*="/social/scene/"]'));
  return links.map(a => ({ href: a.href, text: (a.textContent || '').trim().slice(0, 40) }));
});
console.log(`Found ${sceneLinks.length} scene links`);
if (sceneLinks.length > 0) console.log(`First: ${sceneLinks[0].text} -> ${sceneLinks[0].href}`);
if (sceneLinks.length > 1) console.log(`Second: ${sceneLinks[1].text} -> ${sceneLinks[1].href}`);

// Step 2: Open first scene and test play/pause
if (sceneLinks.length >= 1) {
  console.log('\n=== Step 2: First Scene - Play Test ===');
  await page.goto(sceneLinks[0].href, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  // Check for player elements
  const playerInfo = await page.evaluate(() => {
    const playBtn = document.querySelector('button[title="播放"], button[title="暂停"]');
    const images = document.querySelectorAll('img');
    const narration = document.querySelector('[class*="narration"], p.text-\\[12px\\]');
    return {
      hasPlayBtn: !!playBtn,
      playBtnTitle: playBtn?.getAttribute('title') || 'N/A',
      imageCount: images.length,
      firstImgSrc: images[0]?.src?.slice(0, 80) || 'none',
      narrationText: narration?.textContent?.slice(0, 80) || 'none',
    };
  });
  console.log('Player info:', JSON.stringify(playerInfo, null, 2));
  
  // Try clicking play/pause
  const playBtnClicked = await page.evaluate(() => {
    const btn = document.querySelector('button[title="播放"], button[title="暂停"]');
    if (btn) { btn.click(); return btn.getAttribute('title'); }
    return null;
  });
  console.log(`Clicked play button (was: ${playBtnClicked})`);
  await new Promise(r => setTimeout(r, 1000));
  
  // Check state after click
  const afterClick = await page.evaluate(() => {
    const btn = document.querySelector('button[title="播放"], button[title="暂停"]');
    return btn?.getAttribute('title') || 'not found';
  });
  console.log(`After click, button is: ${afterClick}`);
}

// Step 3: Open second scene and test play
if (sceneLinks.length >= 2) {
  console.log('\n=== Step 3: Second Scene - Play Test ===');
  await page.goto(sceneLinks[1].href, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  const playerInfo2 = await page.evaluate(() => {
    const playBtn = document.querySelector('button[title="播放"], button[title="暂停"]');
    const images = document.querySelectorAll('img');
    return {
      hasPlayBtn: !!playBtn,
      playBtnTitle: playBtn?.getAttribute('title') || 'N/A',
      imageCount: images.length,
      firstImgSrc: images[0]?.src?.slice(0, 80) || 'none',
    };
  });
  console.log('Second player info:', JSON.stringify(playerInfo2, null, 2));
  
  // Click play
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('button[title="播放"], button[title="暂停"]');
    if (btn) { btn.click(); return btn.getAttribute('title'); }
    return null;
  });
  console.log(`Clicked play on second scene (was: ${clicked})`);
  await new Promise(r => setTimeout(r, 1500));
  
  const afterClick2 = await page.evaluate(() => {
    const btn = document.querySelector('button[title="播放"], button[title="暂停"]');
    return btn?.getAttribute('title') || 'not found';
  });
  console.log(`After click on second scene, button is: ${afterClick2}`);
  
  // Try EN toggle
  console.log('\n=== Step 4: EN Toggle Test ===');
  const enToggled = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('EN') || b.textContent.includes('中'));
    if (btn) { 
      const before = btn.textContent.trim();
      btn.click();
      return { before, after: btn.textContent.trim() };
    }
    return null;
  });
  console.log('EN toggle:', JSON.stringify(enToggled));
  await new Promise(r => setTimeout(r, 500));
  
  // Check narration text after toggle
  const narrAfterToggle = await page.evaluate(() => {
    const p = document.querySelector('p.text-\\[12px\\]');
    return p?.textContent?.slice(0, 100) || 'not found';
  });
  console.log(`Narration after EN toggle: ${narrAfterToggle}`);
}

// Summary
console.log('\n=== Console Logs ===');
logs.forEach(l => console.log('  ', l));
if (errors.length) {
  console.log('\n=== Page Errors ===');
  errors.forEach(e => console.log('  ERROR:', e));
} else {
  console.log('\n✅ No page errors!');
}

await browser.close();

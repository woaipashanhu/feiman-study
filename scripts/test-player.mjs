import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
page.on('console', msg => {
  const text = msg.text();
  if (text.includes('hook') || text.includes('Hook') || text.includes('error') || text.includes('Error') || text.includes('310') || msg.type() === 'error' || msg.type() === 'warning') {
    logs.push(`[${msg.type()}] ${text}`);
  }
});
page.on('pageerror', err => {
  logs.push(`[PAGEERROR] ${err.message}\n${err.stack?.substring(0, 500)}`);
});

try {
  // 启用详细的 React 错误
  await page.evaluateOnNewDocument(() => {
    window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = true;
  });
  
  await page.goto('http://localhost:3000/social/scene/social-01', { waitUntil: 'networkidle0', timeout: 20000 });
  
  // 等待足够时间让 React 完成渲染
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('\n========== DETAILED PLAYER TEST ==========');
  console.log(`Total log entries: ${logs.length}`);
  logs.forEach((l, i) => {
    console.log(`\n--- Log ${i + 1} ---`);
    console.log(l.substring(0, 500));
  });
  
  // 获取页面实际内容
  const info = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      rootHTML: root?.innerHTML?.substring(0, 1000) || 'EMPTY',
      rootChildCount: root?.children?.length || 0,
    };
  });
  console.log('\n--- PAGE INFO ---');
  console.log('Root children:', info.rootChildCount);
  console.log('Root HTML:', info.rootHTML.substring(0, 300));
  
  await page.screenshot({ path: '/tmp/player-test-2.png', fullPage: false });
  console.log('\nScreenshot saved to /tmp/player-test-2.png');
} catch(e) {
  console.error('Test error:', e.message);
}

await browser.close();
process.exit(logs.some(l => l.includes('hook') || l.includes('Hook')) ? 1 : 0);

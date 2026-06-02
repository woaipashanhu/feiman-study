import puppeteer from 'puppeteer';

const URL = 'http://47.99.101.168:8890/social';
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

const allLogs = [];
const allErrors = [];

page.on('console', msg => {
  const text = msg.text();
  allLogs.push(`[${msg.type()}] ${text}`);
});
page.on('pageerror', err => {
  allErrors.push(err.message);
});
page.on('requestfailed', req => {
  allErrors.push(`[FAIL] ${req.url()} - ${req.failure().errorText}`);
});

try {
  console.log(`=== Opening ${URL} ===`);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
  
  // 等待 React 渲染
  await new Promise(r => setTimeout(r, 3000));
  
  // 截图
  await page.screenshot({ path: '/tmp/debug-social-list.png', fullPage: true });
  console.log('Screenshot saved: /tmp/debug-social-list.png');
  
  // 获取页面实际内容
  const info = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      rootHTML: root?.innerHTML?.substring(0, 2000) || 'EMPTY',
      rootText: root?.innerText?.substring(0, 1000) || 'EMPTY',
      bodyText: document.body?.innerText?.substring(0, 500) || 'EMPTY',
    };
  });
  
  console.log('\n========== PAGE TEXT ==========');
  console.log(info.rootText);
  
  console.log('\n========== ROOT HTML (first 1500) ==========');
  console.log(info.rootHTML.substring(0, 1500));
  
  // 尝试 fetch JSON 看看页面内是否能访问
  const jsonTest = await page.evaluate(async () => {
    try {
      const resp = await fetch('/data/social-scenes.json');
      const data = await resp.json();
      return {
        status: resp.status,
        keys: Object.keys(data),
        carnegieCount: data.carnegieCatalog?.length,
        socialCount: data.socialStoryCatalog?.length,
        sceneDataCount: data.sceneData ? Object.keys(data.sceneData).length : (data.scenes ? Object.keys(data.scenes).length : 0),
      };
    } catch(e) {
      return { error: e.message };
    }
  });
  
  console.log('\n========== JSON FETCH FROM PAGE ==========');
  console.log(JSON.stringify(jsonTest, null, 2));
  
  // 检查 useContentLoader 的行为
  const loaderInfo = await page.evaluate(() => {
    // 检查是否有全局状态
    return {
      hasRoot: !!document.getElementById('root'),
      rootChildCount: document.getElementById('root')?.children?.length,
      rootInnerHTML_length: document.getElementById('root')?.innerHTML?.length,
    };
  });
  console.log('\n========== DOM STATE ==========');
  console.log(JSON.stringify(loaderInfo, null, 2));
  
} catch(e) {
  console.error('ERROR:', e.message);
}

console.log('\n========== CONSOLE LOGS ==========');
allLogs.forEach((l, i) => {
  if (i < 30) console.log(l.substring(0, 200));
});
if (allLogs.length > 30) console.log(`... and ${allLogs.length - 30} more logs`);

console.log('\n========== ERRORS ==========');
allErrors.forEach((e, i) => console.log(`${i}: ${e.substring(0, 300)}`));

await browser.close();

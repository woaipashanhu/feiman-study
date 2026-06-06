
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  defaultViewport: { width: 390, height: 844 },
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
});

const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

// 先访问首页并注入收藏数据
await page.goto('http://47.99.101.168:8890/', { waitUntil: 'networkidle2', timeout: 20000 });

// 等待 React 挂载
await page.waitForFunction(() => document.querySelector('#root')?.children.length > 0, { timeout: 10000 });

const mockFavorites = JSON.stringify([
  { id: "math:m01-01", boardId: "math", contentId: "m01-01", title: "第1课 认识数字", subtitle: "费曼讲数学", cover: "/previews/m01-01.mp4", videoUrl: "/previews/m01-01.mp4", addedAt: Date.now() },
  { id: "science:atom", boardId: "science", contentId: "atom", title: "原子结构", subtitle: "科学可视化", cover: "/data/science/atom/thumbnail.jpg", addedAt: Date.now() - 1000 },
  { id: "social:s001", boardId: "social", contentId: "s001", title: "你好呀", subtitle: "社交训练", cover: "/data/social/scenes/s001/thumbnail.jpg", addedAt: Date.now() - 2000 },
  { id: "gallery:art_mona_lisa", boardId: "gallery", contentId: "art_mona_lisa", title: "蒙娜丽莎", subtitle: "达芬奇", cover: "/data/gallery/thumbnails/art_mona_lisa.jpg", addedAt: Date.now() - 3000 },
  { id: "math:m01-02", boardId: "math", contentId: "m01-02", title: "第2课 加法基础", subtitle: "费曼讲数学", cover: "/previews/m01-02.mp4", videoUrl: "/previews/m01-02.mp4", addedAt: Date.now() - 4000 },
  { id: "neimen:n01", boardId: "neimen", contentId: "n01", title: "腹式呼吸", subtitle: "内功养生", cover: "/data/neimen/n01/thumbnail.jpg", addedAt: Date.now() - 5000 },
  { id: "math:m01-03", boardId: "math", contentId: "m01-03", title: "第3课 减法入门", subtitle: "费曼讲数学", cover: "/previews/m01-03.mp4", videoUrl: "/previews/m01-03.mp4", addedAt: Date.now() - 6000 },
  { id: "science:earth", boardId: "science", contentId: "earth", title: "地球与月球", subtitle: "科学可视化", cover: "/data/science/earth/thumbnail.jpg", addedAt: Date.now() - 7000 }
]);

await page.evaluate((data) => {
  localStorage.setItem('feiman_favorites', data);
}, mockFavorites);

// 通过前端路由导航到收藏页
await page.evaluate(() => {
  window.history.pushState({}, '', '/favorites');
});

// 触发 popstate 让 React Router 响应
await page.evaluate(() => {
  window.dispatchEvent(new PopStateEvent('popstate'));
});

// 等待页面渲染
await page.waitForFunction(() => document.body.innerText.includes('我的收藏'), { timeout: 10000 });

// 再等一下动画
await new Promise(r => setTimeout(r, 2000));

const screenshotPath = '/Users/liuzhen/Documents/lingxi-claw/20260605-14-20-02-486/screenshot-favorites.png';
await page.screenshot({ path: screenshotPath, fullPage: false });
console.log('收藏页截图已保存:', screenshotPath);

// 检查内容
const bodyText = await page.evaluate(() => document.body.innerText);
console.log('页面文本片段:', bodyText.substring(0, 300));

await browser.close();

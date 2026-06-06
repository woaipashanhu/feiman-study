
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  defaultViewport: { width: 390, height: 844 },
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();

// 设置 iPhone 12 user-agent
await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

// 先设置模拟收藏数据到 localStorage
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

// 先访问任意页面注入 localStorage
await page.goto('http://47.99.101.168:8890/', { waitUntil: 'networkidle0', timeout: 30000 });
await page.evaluate((data) => {
  localStorage.setItem('feiman_favorites', data);
}, mockFavorites);

// 刷新并导航到收藏页
await page.goto('http://47.99.101.168:8890/favorites', { waitUntil: 'networkidle0', timeout: 30000 });

// 等动画稳定
await new Promise(r => setTimeout(r, 2000));

const screenshotPath = '/Users/liuzhen/Documents/lingxi-claw/20260605-14-20-02-486/screenshot-favorites.png';
await page.screenshot({ path: screenshotPath, fullPage: false });
console.log('截图已保存:', screenshotPath);

// 同时截一张首页做对比
await page.goto('http://47.99.101.168:8890/', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));
const homePath = '/Users/liuzhen/Documents/lingxi-claw/20260605-14-20-02-486/screenshot-home.png';
await page.screenshot({ path: homePath, fullPage: false });
console.log('首页截图已保存:', homePath);

await browser.close();

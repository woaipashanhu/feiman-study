import puppeteer from 'puppeteer';

const URL = 'http://47.99.101.168:8890';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

const logs = [];
page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warn') logs.push(`[${msg.type()}] ${msg.text()}`); });

// Bypass service worker cache
await page.setCacheEnabled(false);
await page.goto(`${URL}/social`, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));

const html = await page.content();
console.log('Page HTML length:', html.length);

// Get all text content
const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 2000) || 'empty');
console.log('Body text:\n', bodyText);

// Get all links
const allLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => ({ href: a.href, text: a.textContent?.trim()?.slice(0, 50) })));
console.log('\nAll links:', JSON.stringify(allLinks, null, 2));

logs.forEach(l => console.log('LOG:', l));
await browser.close();

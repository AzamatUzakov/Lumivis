import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import http from 'http';

const ARTIFACT_DIR = 'C:/Users/User/.gemini/antigravity-ide/brain/68bfa7aa-6577-481c-9f04-2b0670d5c567';

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let safePath = req.url.split('?')[0];
  let filePath = path.join(path.resolve('./dist'), safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(43210, async () => {
  console.log('Server running on http://localhost:43210');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    protocolTimeout: 30000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const routes = [
    { lang: 'ru', url: 'http://localhost:43210/ru/' },
    { lang: 'uz', url: 'http://localhost:43210/uz/' },
    { lang: 'en', url: 'http://localhost:43210/en/' },
  ];

  async function preparePage(page) {
    await page.evaluate(() => {
      document.querySelectorAll('.reveal, .reveal-hero, .reveal-left, .reveal-right, .reveal-up, .reveal-fade').forEach(el => {
        el.classList.add('active', 'animated');
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.visibility = 'visible';
      });
    });
  }

  // Desktop Screenshots (1280px)
  for (const item of routes) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1.5 });
    await page.goto(item.url, { waitUntil: 'load' });
    await preparePage(page);
    await new Promise(r => setTimeout(r, 600));

    const screenshotPath = path.join(ARTIFACT_DIR, `hero_desktop_${item.lang}.png`);
    await page.screenshot({ path: screenshotPath, clip: { x: 0, y: 0, width: 1280, height: 750 } });
    console.log(`Saved hero_desktop_${item.lang}.png`);
    await page.close();
  }

  // Mobile Screenshots (375px)
  for (const item of routes) {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
    await page.goto(item.url, { waitUntil: 'load' });
    await preparePage(page);
    await new Promise(r => setTimeout(r, 600));

    const screenshotPath = path.join(ARTIFACT_DIR, `hero_mobile_${item.lang}.png`);
    await page.screenshot({ path: screenshotPath, clip: { x: 0, y: 0, width: 375, height: 780 } });
    console.log(`Saved hero_mobile_${item.lang}.png`);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('Done capturing hero proofs with header!');
  process.exit(0);
});

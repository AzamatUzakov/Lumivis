const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer-core');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

function startServer(port = 4389) {
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
  };

  const distDir = path.join(__dirname, '..', 'dist');

  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    let fullPath = path.join(distDir, reqPath);

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      fullPath = path.join(fullPath, 'index.html');
    }

    if (!fs.existsSync(fullPath)) {
      res.writeHead(404);
      res.end('Not found: ' + reqPath);
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(fullPath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function main() {
  const root = path.join(__dirname, '..');
  const server = await startServer(4389);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const langs = ['ru', 'uz', 'en'];
  const viewports = [
    { width: 1440, height: 900, name: '1440px' },
    { width: 768, height: 1024, name: '768px' },
    { width: 375, height: 812, name: '375px' }
  ];

  for (const lang of langs) {
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:4389/${lang}/`, { waitUntil: 'networkidle0' });

      const statsData = await page.evaluate(() => {
        const stats = document.querySelectorAll('.hero__stat');
        return Array.from(stats).map(s => {
          const val = s.querySelector('.hero__stat-value')?.textContent?.trim();
          const lbl = s.querySelector('.hero__stat-label')?.textContent?.trim();
          const rect = s.getBoundingClientRect();
          return { val, lbl, width: Math.round(rect.width), height: Math.round(rect.height) };
        });
      });

      console.log(`[${lang.toUpperCase()} - ${vp.name}] stats:`, JSON.stringify(statsData));

      if (lang === 'ru') {
        const statsEl = await page.$('.hero__stats');
        if (statsEl) {
          await statsEl.screenshot({ path: path.join(root, 'scratch', `hero_stats_${vp.name}.png`) });
        }
      }
    }
  }

  await browser.close();
  server.close();
}

main().catch(console.error);

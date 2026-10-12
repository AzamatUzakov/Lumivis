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

function startServer(port = 4398) {
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
  const server = await startServer(4398);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const vp of [{ width: 1440, height: 900, name: '1440px' }, { width: 768, height: 1024, name: '768px' }, { width: 375, height: 812, name: '375px' }]) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:4398/ru/', { waitUntil: 'networkidle0' });

    const measurements = await page.evaluate(() => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      const sec = document.getElementById('lenses');
      if (sec) sec.scrollIntoView({ behavior: 'instant' });

      const g1 = document.querySelector('.lenses-group');
      const cards = Array.from(g1.querySelectorAll('.lens-card'));
      const cardHeights = cards.map(c => Math.round(c.getBoundingClientRect().height));
      const cardWidths = cards.map(c => Math.round(c.getBoundingClientRect().width));

      const card6 = g1.querySelector('.lens-card--set');
      const thumb6 = card6.querySelector('.lens-card__thumb');
      const thumb6Rect = thumb6.getBoundingClientRect();

      return {
        cardHeights,
        cardWidths,
        card6: {
          width: Math.round(card6.getBoundingClientRect().width),
          height: Math.round(card6.getBoundingClientRect().height),
          thumbWidth: Math.round(thumb6Rect.width),
          thumbHeight: Math.round(thumb6Rect.height),
          thumbRatio: (thumb6Rect.width / thumb6Rect.height).toFixed(2),
        }
      };
    });

    console.log(`Viewport ${vp.name}:`, measurements);

    // Capture screenshot showing card 6
    await page.evaluate(() => {
      const track = document.querySelector('.lenses-track');
      if (track) {
        track.style.animation = 'none';
        track.style.transform = 'translateX(-900px)';
      }
    });
    await new Promise(r => setTimeout(r, 400));
    const lensesSec = await page.$('#lenses');
    if (lensesSec) {
      await lensesSec.screenshot({ path: path.join(root, 'scratch', `lenses_card6_${vp.name}.png`) });
    }
  }

  await browser.close();
  server.close();
}

main().catch(console.error);

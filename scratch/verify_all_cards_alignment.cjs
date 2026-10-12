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

function startServer(port = 4388) {
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
  const server = await startServer(4388);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const viewports = [
    { width: 1440, height: 900, name: '1440px' },
    { width: 768, height: 1024, name: '768px' },
    { width: 375, height: 812, name: '375px' }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:4388/ru/', { waitUntil: 'networkidle0' });

    const data = await page.evaluate(() => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      const sec = document.getElementById('lenses');
      if (sec) sec.scrollIntoView({ behavior: 'instant' });

      const g1 = document.querySelector('.lenses-group');
      const cards = Array.from(g1.querySelectorAll('.lens-card'));

      return cards.map((c, idx) => {
        const cRect = c.getBoundingClientRect();
        const thumb = c.querySelector('.lens-card__thumb').getBoundingClientRect();
        const name = c.querySelector('.lens-card__name').getBoundingClientRect();
        const desc = c.querySelector('.lens-card__desc').getBoundingClientRect();

        return {
          id: idx + 1,
          cardWidth: Math.round(cRect.width),
          cardHeight: Math.round(cRect.height),
          thumbWidth: Math.round(thumb.width),
          thumbHeight: Math.round(thumb.height),
          // Vertical offset of thumb, name, and desc relative to the card's top
          thumbTopOffset: Math.round(thumb.top - cRect.top),
          nameTopOffset: Math.round(name.top - cRect.top),
          descTopOffset: Math.round(desc.top - cRect.top),
        };
      });
    });

    console.log(`\n=== VIEWPORT ${vp.name} ===`);
    console.table(data);

    // Assertions
    const allSameWidth = data.every(d => d.cardWidth === data[0].cardWidth);
    const allSameHeight = data.every(d => d.cardHeight === data[0].cardHeight);
    const allSameThumbHeight = data.every(d => d.thumbHeight === data[0].thumbHeight);
    const allSameNameTop = data.every(d => d.nameTopOffset === data[0].nameTopOffset);

    console.log(`All card widths equal: ${allSameWidth} (${data[0].cardWidth}px)`);
    console.log(`All card heights equal: ${allSameHeight} (${data[0].cardHeight}px)`);
    console.log(`All thumb heights equal: ${allSameThumbHeight} (${data[0].thumbHeight}px)`);
    console.log(`All titles start at same level: ${allSameNameTop} (${data[0].nameTopOffset}px from card top)`);

    // Capture screenshot showing cards 4, 5, 6
    await page.evaluate(() => {
      const track = document.querySelector('.lenses-track');
      if (track) {
        track.style.animation = 'none';
        track.style.transform = 'translateX(-800px)';
      }
    });
    await new Promise(r => setTimeout(r, 400));
    const lensesSec = await page.$('#lenses');
    if (lensesSec) {
      await lensesSec.screenshot({ path: path.join(root, 'scratch', `lenses_alignment_${vp.name}.png`) });
    }
  }

  await browser.close();
  server.close();
}

main().catch(console.error);

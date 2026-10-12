const fs = require('fs');
const path = require('path');
const http = require('http');
const sharp = require('sharp');
const puppeteer = require('puppeteer-core');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

// Simple static server for dist/
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
  const distDir = path.join(root, 'dist');
  const distAstroDir = path.join(distDir, '_astro');
  const outScreenshots = path.join(root, 'scratch');

  console.log('=== TEST 1: ASSETS IN dist/_astro ===');
  const lensesFiles = fs.readdirSync(distAstroDir).filter(f => /^lens\d\..*\.webp$/i.test(f));
  const lensesData = [];
  for (const f of lensesFiles) {
    const full = path.join(distAstroDir, f);
    const st = fs.statSync(full);
    const meta = await sharp(full).metadata();
    lensesData.push({
      file: f,
      dim: `${meta.width}x${meta.height}`,
      bytes: st.size,
      kb: (st.size / 1024).toFixed(1),
    });
  }
  lensesData.sort((a, b) => a.file.localeCompare(b.file));
  console.table(lensesData);

  const maxEquip = 34.2;
  const threshold = maxEquip * 1.1;
  console.log(`Max equip webp threshold (+10% of 34.2 KB): ${threshold.toFixed(2)} KB`);
  for (const l of lensesData) {
    const val = parseFloat(l.kb);
    console.log(`Lens ${l.file}: ${val} KB <= ${threshold.toFixed(2)} KB? ${val <= threshold}`);
  }

  // Directory sizes
  function walkDir(dir) {
    let totalBytes = 0;
    let fileCount = 0;
    let imageBytes = 0;
    let imageCount = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const sub = walkDir(fullPath);
        totalBytes += sub.totalBytes;
        fileCount += sub.fileCount;
        imageBytes += sub.imageBytes;
        imageCount += sub.imageCount;
      } else {
        const st = fs.statSync(fullPath);
        totalBytes += st.size;
        fileCount++;
        if (/\.(webp|jpg|jpeg|png|svg|avif|gif)$/i.test(ent.name)) {
          imageBytes += st.size;
          imageCount++;
        }
      }
    }
    return { totalBytes, fileCount, imageBytes, imageCount };
  }

  const distStats = walkDir(distDir);
  const astroStats = walkDir(distAstroDir);
  console.log('dist total:', (distStats.totalBytes / (1024 * 1024)).toFixed(2), 'MB');
  console.log('dist/_astro images:', (astroStats.imageBytes / (1024 * 1024)).toFixed(2), 'MB');

  // Start preview server
  const server = await startServer(4398);
  console.log('Server started on http://localhost:4398');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log('\n=== TEST 2: LAZY LOADING OF LENSES IMAGES ===');
  const requestedImages = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/_astro/lens')) {
      requestedImages.push(url);
    }
  });

  // Load top of page (hero)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4398/ru/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  console.log('Lenses requested before scrolling down to #lenses:', requestedImages.length);

  // Scroll to lenses
  await page.evaluate(() => {
    const el = document.getElementById('lenses');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 1000));
  console.log('Lenses requested after scrolling to #lenses:', requestedImages.length);

  console.log('\n=== TEST 3: VIEWPORTS AND SCREENSHOTS ===');
  const viewports = [
    { width: 1440, height: 900, name: '1440px' },
    { width: 1024, height: 800, name: '1024px' },
    { width: 768, height: 1024, name: '768px' },
    { width: 375, height: 812, name: '375px' },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:4398/ru/', { waitUntil: 'networkidle0' });
    
    // Add is-visible to reveals
    await page.evaluate(() => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      const el = document.getElementById('lenses');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 600));

    // Measure card heights in row
    const cardHeights = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('#lenses .lens-cell'));
      return cells.map(c => Math.round(c.getBoundingClientRect().height));
    });
    console.log(`Viewport ${vp.name} card heights:`, cardHeights);

    // Capture screenshot of #lenses section
    const lensesSection = await page.$('#lenses');
    if (lensesSection) {
      const ssPath = path.join(outScreenshots, `lenses_${vp.name}.png`);
      await lensesSection.screenshot({ path: ssPath });
      console.log(`Saved screenshot: lenses_${vp.name}.png`);
    }
  }

  console.log('\n=== TEST 4: MULTILINGUAL VERIFICATION ===');
  for (const lang of ['ru', 'uz', 'en']) {
    await page.goto(`http://localhost:4398/${lang}/`, { waitUntil: 'networkidle0' });
    const info = await page.evaluate(() => {
      const title = document.querySelector('#lenses h2')?.textContent?.trim();
      const cells = Array.from(document.querySelectorAll('#lenses .lens-cell'));
      const cardTexts = cells.map(c => ({
        index: c.querySelector('.lens-cell__index')?.textContent?.trim(),
        name: c.querySelector('.lens-cell__name')?.textContent?.trim(),
        desc: c.querySelector('.lens-cell__desc')?.textContent?.trim(),
        alt: c.querySelector('img')?.getAttribute('alt'),
      }));
      return { title, cardTexts };
    });
    console.log(`Language ${lang} title: "${info.title}"`);
    console.log(`Language ${lang} cards count:`, info.cardTexts.length);
    console.log(`Card 1 alt: "${info.cardTexts[0].alt}"`);
    console.log(`Card 1 name: "${info.cardTexts[0].name}"`);
  }

  await browser.close();
  server.close();
  console.log('\nAll tests complete!');
}

main().catch(console.error);

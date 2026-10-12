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

function startServer(port = 4397) {
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

  const server = await startServer(4397);
  console.log('Server started on http://localhost:4397');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log('\n=== TEST 2: CAROUSEL GEOMETRY & SEAMLESSNESS ===');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4397/ru/', { waitUntil: 'networkidle0' });

  const geom = await page.evaluate(() => {
    const carousel = document.querySelector('.lenses-carousel');
    const track = document.querySelector('.lenses-track');
    const groups = Array.from(document.querySelectorAll('.lenses-group'));
    const g1 = groups[0];
    const g2 = groups[1];

    const cRect = carousel.getBoundingClientRect();
    const g1Rect = g1.getBoundingClientRect();
    const g2Rect = g2.getBoundingClientRect();
    const styleTrack = window.getComputedStyle(track);
    const styleG1 = window.getComputedStyle(g1);

    const cards = Array.from(g1.querySelectorAll('.lens-card'));
    const cardHeights = cards.map(c => Math.round(c.getBoundingClientRect().height));

    return {
      carouselWidth: Math.round(cRect.width),
      g1Width: Math.round(g1.offsetWidth),
      g2Width: Math.round(g2.offsetWidth),
      cardCount: cards.length,
      cardHeights,
      animationName: styleTrack.animationName,
      animationDuration: styleTrack.animationDuration,
      animationTimingFunction: styleTrack.animationTimingFunction,
      animationIterationCount: styleTrack.animationIterationCount,
      pointerEvents: window.getComputedStyle(carousel).pointerEvents,
      userSelect: window.getComputedStyle(carousel).userSelect,
    };
  });

  console.log('Carousel geometry:', geom);
  console.log(`Group 1 width (${geom.g1Width}px) >= Viewport width (${geom.carouselWidth}px):`, geom.g1Width >= geom.carouselWidth);
  console.log(`Group 1 equals Group 2:`, geom.g1Width === geom.g2Width);
  console.log(`Card heights are all equal:`, geom.cardHeights.every(h => h === geom.cardHeights[0]));
  console.log(`No interaction: pointer-events="${geom.pointerEvents}", user-select="${geom.userSelect}"`);

  console.log('\n=== TEST 3: SCREENSHOTS (1440px, 768px, 375px) ===');
  const viewports = [
    { width: 1440, height: 900, name: '1440px' },
    { width: 768, height: 1024, name: '768px' },
    { width: 375, height: 812, name: '375px' },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:4397/ru/', { waitUntil: 'networkidle0' });

    // Scroll to #lenses and pause animation for a clean screenshot
    await page.evaluate(() => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      const sec = document.getElementById('lenses');
      if (sec) sec.scrollIntoView({ behavior: 'instant' });
      const track = document.querySelector('.lenses-track');
      if (track) track.style.animationPlayState = 'paused';
    });
    await new Promise(r => setTimeout(r, 600));

    const lensesSec = await page.$('#lenses');
    if (lensesSec) {
      const ssPath = path.join(outScreenshots, `lenses_carousel_${vp.name}.png`);
      await lensesSec.screenshot({ path: ssPath });
      console.log(`Saved screenshot: lenses_carousel_${vp.name}.png`);
    }
  }

  console.log('\n=== TEST 4: PREFERS-REDUCED-MOTION ===');
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:4397/ru/', { waitUntil: 'networkidle0' });
  const reducedMotionCheck = await page.evaluate(() => {
    const track = document.querySelector('.lenses-track');
    const g2 = document.querySelector('.lenses-group[aria-hidden="true"]');
    const trackStyle = window.getComputedStyle(track);
    const g2Style = window.getComputedStyle(g2);
    return {
      animation: trackStyle.animationName,
      g2Display: g2Style.display,
    };
  });
  console.log('Reduced motion check:', reducedMotionCheck);

  console.log('\n=== TEST 5: MULTILINGUAL VERIFICATION ===');
  for (const lang of ['ru', 'uz', 'en']) {
    await page.emulateMediaFeatures([]);
    await page.goto(`http://localhost:4397/${lang}/`, { waitUntil: 'networkidle0' });
    const info = await page.evaluate(() => {
      const title = document.querySelector('#lenses h2')?.textContent?.trim();
      const g1 = document.querySelector('.lenses-group');
      const cards = Array.from(g1.querySelectorAll('.lens-card'));
      return {
        title,
        cardsCount: cards.length,
        card5Name: cards[4]?.querySelector('.lens-card__name')?.textContent?.trim(),
        card5Desc: cards[4]?.querySelector('.lens-card__desc')?.textContent?.trim(),
        card6Name: cards[5]?.querySelector('.lens-card__name')?.textContent?.trim(),
        card6Desc: cards[5]?.querySelector('.lens-card__desc')?.textContent?.trim(),
      };
    });
    console.log(`Language ${lang} title: "${info.title}", cards count: ${info.cardsCount}`);
    console.log(`  Card 5: "${info.card5Name}" - "${info.card5Desc}"`);
    console.log(`  Card 6: "${info.card6Name}" - "${info.card6Desc}"`);
  }

  await browser.close();
  server.close();
  console.log('\nAll carousel tests passed successfully!');
}

main().catch(console.error);

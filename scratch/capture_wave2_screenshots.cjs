const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer-core');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\68bfa7aa-6577-481c-9f04-2b0670d5c567';

// Simple static file server
function startServer(port = 4321) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath.endsWith('/')) reqPath += 'index.html';
      
      let filePath = path.join(DIST_DIR, reqPath);
      if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      }
      if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      }

      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
      };

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });

    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}/`);
      resolve(server);
    });
  });
}

async function capture() {
  const server = await startServer(4321);
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Desktop Gallery (1280px)
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:4321/ru/#gallery', { waitUntil: 'networkidle0' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 600));
  
  const galleryEl = await page.$('#gallery');
  if (galleryEl) {
    await galleryEl.screenshot({ path: path.join(ARTIFACT_DIR, 'gallery_desktop_ru.png') });
    console.log('Saved gallery_desktop_ru.png');
  }

  // 2. Mobile Gallery (375px)
  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:4321/ru/#gallery', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const galleryMob = await page.$('#gallery');
  if (galleryMob) {
    await galleryMob.screenshot({ path: path.join(ARTIFACT_DIR, 'gallery_mobile_ru.png') });
    console.log('Saved gallery_mobile_ru.png');
  }

  // 3. Mobile Doctors Carousel (375px)
  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:4321/ru/#doctors', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const doctorsMob = await page.$('#doctors');
  if (doctorsMob) {
    await doctorsMob.screenshot({ path: path.join(ARTIFACT_DIR, 'doctors_mobile_375px.png') });
    console.log('Saved doctors_mobile_375px.png');
  }

  // 4. Desktop Equipment (1280px)
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:4321/ru/#equipment', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const equipDesk = await page.$('#equipment');
  if (equipDesk) {
    await equipDesk.screenshot({ path: path.join(ARTIFACT_DIR, 'equipment_desktop_1280px.png') });
    console.log('Saved equipment_desktop_1280px.png');
  }

  // 5. Mobile Equipment (375px)
  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:4321/ru/#equipment', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const equipMob = await page.$('#equipment');
  if (equipMob) {
    await equipMob.screenshot({ path: path.join(ARTIFACT_DIR, 'equipment_mobile_375px.png') });
    console.log('Saved equipment_mobile_375px.png');
  }

  // 6. RnInfoModal open
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:4321/ru/#services', { waitUntil: 'networkidle0' });
  await page.click('[data-open-rn-modal]');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'rn_modal_opened.png') });
  console.log('Saved rn_modal_opened.png');

  // 7. GalleryInfoModal open (card #3 AKA-01)
  await page.goto('http://localhost:4321/ru/#gallery', { waitUntil: 'networkidle0' });
  await page.click('[data-open-gallery-modal="3"]');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gallery_modal_card3_aka01.png') });
  console.log('Saved gallery_modal_card3_aka01.png');

  // 8. GalleryInfoModal open (card #6 Rucheyok)
  await page.goto('http://localhost:4321/uz/#gallery', { waitUntil: 'networkidle0' });
  await page.click('[data-open-gallery-modal="6"]');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'gallery_modal_card6_rucheyok_uz.png') });
  console.log('Saved gallery_modal_card6_rucheyok_uz.png');

  await browser.close();
  server.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});

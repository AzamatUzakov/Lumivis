import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import http from 'http';

const ARTIFACT_DIR = 'C:/Users/User/.gemini/antigravity-ide/brain/68bfa7aa-6577-481c-9f04-2b0670d5c567';
const DIST_DIR = path.resolve('dist');

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

function startServer(port) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0].split('#')[0];
    let filePath = path.join(DIST_DIR, reqUrl);
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found: ' + req.url);
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise(resolve => {
    server.listen(port, '127.0.0.1', () => {
      console.log(`Static server running on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

(async () => {
  const server = await startServer(4321);

  const captureScreen = async (urlPath, filename, isForm = false) => {
    let browser;
    try {
      browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
      await page.goto(`http://127.0.0.1:4321${urlPath}`, { waitUntil: 'networkidle0' });

      await page.evaluate(() => {
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-up, .reveal-fade').forEach(el => {
          el.classList.add('active', 'animated');
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.visibility = 'visible';
        });
        const header = document.querySelector('header');
        if (header) header.style.display = 'none';
      });

      await new Promise(r => setTimeout(r, 600));

      const outPath = path.join(ARTIFACT_DIR, filename);

      if (isForm) {
        await page.evaluate(() => {
          const el = document.getElementById('booking-form-section');
          if (el) el.scrollIntoView();
        });
        await new Promise(r => setTimeout(r, 400));
        const formEl = await page.$('#booking-form-section');
        if (formEl) await formEl.screenshot({ path: outPath });
        else await page.screenshot({ path: outPath });
      } else {
        await page.screenshot({ path: outPath });
      }

      console.log('Saved:', filename);
    } catch (err) {
      console.error('Failed capturing', filename, err.message);
    } finally {
      if (browser) await browser.close();
    }
  };

  // 1. Booking form screenshots (RU, UZ, EN)
  await captureScreen('/ru/', 'booking_form_ru.png', true);
  await captureScreen('/uz/', 'booking_form_uz.png', true);
  await captureScreen('/en/', 'booking_form_en.png', true);

  // 2. Privacy page screenshots (RU, UZ, EN)
  await captureScreen('/ru/privacy/', 'privacy_ru.png', false);
  await captureScreen('/uz/privacy/', 'privacy_uz.png', false);
  await captureScreen('/en/privacy/', 'privacy_en.png', false);

  server.close();
  console.log('All Stage 4 screenshots captured successfully!');
  process.exit(0);
})();

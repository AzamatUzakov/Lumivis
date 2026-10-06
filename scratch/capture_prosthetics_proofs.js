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

server.listen(43212, async () => {
  console.log('Server running on http://localhost:43212');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    protocolTimeout: 30000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  async function preparePage(page) {
    await page.evaluate(async () => {
      document.querySelectorAll('.reveal, .reveal-hero, .reveal-left, .reveal-right, .reveal-up, .reveal-fade').forEach(el => {
        el.classList.add('active', 'animated');
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.visibility = 'visible';
      });

      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(imgs.map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise(r => { img.onload = r; img.onerror = r; setTimeout(r, 400); });
      }));
    });
  }

  // Desktop Screenshot (1280px)
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:43212/ru/', { waitUntil: 'load' });
    await preparePage(page);
    await page.evaluate(() => {
      const p = document.getElementById('prosthetics');
      if (p) p.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 600));

    const elem = await page.$('#prosthetics');
    if (elem) {
      await elem.screenshot({ path: path.join(ARTIFACT_DIR, 'prosthetics_desktop_proof.png') });
      console.log('Saved prosthetics_desktop_proof.png');
    }
    await page.close();
  }

  // Mobile Screenshot (375px)
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
    await page.goto('http://localhost:43212/ru/', { waitUntil: 'load' });
    await preparePage(page);
    await page.evaluate(() => {
      const p = document.getElementById('prosthetics');
      if (p) p.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 600));

    const elem = await page.$('#prosthetics');
    if (elem) {
      await elem.screenshot({ path: path.join(ARTIFACT_DIR, 'prosthetics_mobile_proof.png') });
      console.log('Saved prosthetics_mobile_proof.png');
    }
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('Done capturing prosthetics proofs!');
  process.exit(0);
});

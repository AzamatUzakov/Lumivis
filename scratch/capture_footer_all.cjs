const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const langs = ['ru', 'uz', 'en'];
const artifactDir = `C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\68bfa7aa-6577-481c-9f04-2b0670d5c567`;
const distDir = path.join(__dirname, '..', 'dist');

function startServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.webp': 'image/webp',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };

      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function main() {
  const PORT = 54321;
  const server = await startServer(PORT);

  let executablePath = chromePaths.find(p => fs.existsSync(p));
  if (!executablePath) {
    server.close();
    throw new Error('Chrome/Edge executable not found on system.');
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Desktop captures
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle2' });

  for (const lang of langs) {
    await page.evaluate((langCode) => {
      const btn = document.querySelector(`.lang-btn[data-lang="${langCode}"]`);
      if (btn) btn.click();
    }, lang);
    await new Promise(r => setTimeout(r, 300));

    const footerEl = await page.$('#footer');
    if (footerEl) {
      const screenshotPath = path.join(artifactDir, `footer_desktop_${lang}.png`);
      await footerEl.screenshot({ path: screenshotPath });
      console.log(`Saved Desktop ${lang.toUpperCase()} footer screenshot to:`, screenshotPath);
    }
  }

  // Mobile captures
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle2' });

  for (const lang of langs) {
    await page.evaluate((langCode) => {
      const btn = document.querySelector(`.lang-btn[data-lang="${langCode}"]`);
      if (btn) btn.click();
    }, lang);
    await new Promise(r => setTimeout(r, 300));

    const brandEl = await page.$('.footer-brand');
    if (brandEl) {
      const screenshotPath = path.join(artifactDir, `footer_mobile_${lang}.png`);
      await brandEl.screenshot({ path: screenshotPath });
      console.log(`Saved Mobile ${lang.toUpperCase()} footer brand screenshot to:`, screenshotPath);
    }
  }

  await browser.close();
  server.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

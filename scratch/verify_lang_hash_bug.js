import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import http from 'http';

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

server.listen(43211, async () => {
  console.log('Server running on http://localhost:43211');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    protocolTimeout: 30000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Test 1: At top of page (/ru/) -> click UZ button
  {
    const page = await browser.newPage();
    await page.goto('http://localhost:43211/ru/', { waitUntil: 'load' });
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.evaluate(() => {
        const btn = document.querySelector('a[data-lang-btn="uz"]');
        if (btn) btn.click();
      })
    ]);

    const finalUrl = page.url();
    console.log('TEST 1 (Top of page /ru/ -> UZ click): final URL is:', finalUrl);
    if (finalUrl === 'http://localhost:43211/uz/') {
      console.log('PASS TEST 1: Clean URL http://localhost:43211/uz/ without hash!');
    } else {
      console.error('FAIL TEST 1: Got:', finalUrl);
    }
    await page.close();
  }

  // Test 2: At /ru/#doctors -> click UZ button
  {
    const page = await browser.newPage();
    await page.goto('http://localhost:43211/ru/#doctors', { waitUntil: 'load' });
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.evaluate(() => {
        const btn = document.querySelector('a[data-lang-btn="uz"]');
        if (btn) btn.click();
      })
    ]);

    const finalUrl = page.url();
    console.log('TEST 2 (At /ru/#doctors -> UZ click): final URL is:', finalUrl);
    if (finalUrl === 'http://localhost:43211/uz/#doctors') {
      console.log('PASS TEST 2: Preserved section hash http://localhost:43211/uz/#doctors!');
    } else {
      console.error('FAIL TEST 2: Got:', finalUrl);
    }
    await page.close();
  }

  await browser.close();
  server.close();
  process.exit(0);
});

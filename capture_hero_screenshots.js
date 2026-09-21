import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/User/.gemini/antigravity-ide/brain/c681e96b-61c3-4c12-a615-88a5c110e595';

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

(async () => {
  console.log('Starting preview server on port 4326...');
  const server = spawn('npx', ['astro', 'preview', '--port', '4326'], {
    shell: true,
    cwd: 'C:/Users/User/Desktop/lumivis lending'
  });

  await new Promise(r => setTimeout(r, 3500));

  console.log('Launching browser with path:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const resolutions = [
    { width: 393, height: 1000, label: '393' },
    { width: 768, height: 1000, label: '768' },
    { width: 1440, height: 1000, label: '1440' }
  ];

  const langs = ['ru', 'en', 'uz'];

  for (const lang of langs) {
    for (const res of resolutions) {
      await page.setViewport({ width: res.width, height: res.height, deviceScaleFactor: 2 });
      await page.goto('http://localhost:4326', { waitUntil: 'networkidle2' });

      // Click language button
      await page.evaluate((l) => {
        const btn = document.querySelector(`.lang-btn[data-lang="${l}"]`);
        if (btn) btn.click();
      }, lang);

      // Hide header for clean hero screenshot
      await page.evaluate(() => {
        const h = document.getElementById('site-header');
        if (h) h.style.display = 'none';
      });

      await new Promise(r => setTimeout(r, 400));

      const heroEl = await page.$('#hero');
      if (heroEl) {
        const outPath = path.join(ARTIFACT_DIR, `hero_${lang}_${res.label}.png`);
        await heroEl.screenshot({ path: outPath });
        console.log(`Saved ${outPath}`);
      } else {
        console.error('Could not find #hero element');
      }
    }
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();

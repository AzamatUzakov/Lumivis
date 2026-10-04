import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/User/.gemini/antigravity-ide/brain/68bfa7aa-6577-481c-9f04-2b0670d5c567';

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

(async () => {
  console.log('Starting preview server on port 4332...');
  const server = spawn('npx', ['astro', 'preview', '--port', '4332'], {
    shell: true,
    cwd: 'C:/Users/User/Desktop/lumivis lending'
  });

  await new Promise(r => setTimeout(r, 4000));

  console.log('Launching browser with path:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const testLangs = ['ru', 'uz', 'en'];

  for (const lang of testLangs) {
    await page.goto('http://localhost:4332', { waitUntil: 'networkidle2' });

    // Switch language
    await page.evaluate((l) => {
      const btn = document.querySelector(`.lang-btn[data-lang="${l}"]`);
      if (btn) btn.click();
    }, lang);
    await new Promise(r => setTimeout(r, 300));

    // Force animations and scroll into view
    await page.evaluate(() => {
      document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up').forEach(el => {
        el.classList.add('active', 'animated');
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      const sec = document.getElementById('retinopathy');
      if (sec) sec.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 400));

    const rnEl = await page.$('#retinopathy');
    if (rnEl) {
      const outPath = path.join(ARTIFACT_DIR, `retinopathy_i18n_${lang}.png`);
      await rnEl.screenshot({ path: outPath });
      console.log(`Saved screenshot: ${outPath}`);
    }
  }

  await browser.close();
  server.kill();
  console.log('Done capturing retinopathy i18n screenshots!');
  process.exit(0);
})();

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
  console.log('Starting preview server on port 4330...');
  const server = spawn('npx', ['astro', 'preview', '--port', '4330'], {
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

  const testLangs = ['ru', 'uz', 'en'];

  for (const lang of testLangs) {
    // Desktop Viewport
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:4330', { waitUntil: 'networkidle2' });

    // Click language switcher button
    await page.evaluate((l) => {
      const btn = document.querySelector(`.lang-btn[data-lang="${l}"]`);
      if (btn) btn.click();
    }, lang);
    await new Promise(r => setTimeout(r, 300));

    // Open Card 11 (AMO-ATOS + AMBLIO-1)
    await page.evaluate(() => {
      const card = document.querySelector('[data-open-gallery-modal="11"]');
      if (card) card.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const desktopPath = path.join(ARTIFACT_DIR, `gallery_modal_compact_card11_${lang}.png`);
    await page.screenshot({ path: desktopPath, fullPage: false });
    console.log(`Saved screenshot: ${desktopPath}`);

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('[data-close-gallery-modal]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));
  }

  // Mobile test on RU for Card 11
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });
  await page.evaluate(() => {
    const card = document.querySelector('[data-open-gallery-modal="11"]');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const mobilePath = path.join(ARTIFACT_DIR, `gallery_modal_compact_mobile_ru.png`);
  await page.screenshot({ path: mobilePath, fullPage: false });
  console.log(`Saved screenshot: ${mobilePath}`);

  await browser.close();
  server.kill();
  console.log('Done capturing updated screenshots!');
  process.exit(0);
})();

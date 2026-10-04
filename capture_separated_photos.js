import puppeteer from 'puppeteer-core';
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
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4321', { waitUntil: 'networkidle2' });

  await page.evaluate(() => {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-up').forEach(el => {
      el.classList.add('active', 'animated');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    const el = document.getElementById('services');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 400));

  // Hide sticky header for clean screenshot
  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
  });

  const card01 = await page.$('.bento-item--rn');
  if (card01) {
    const outPath = path.join(ARTIFACT_DIR, 'services_card01_clean_desktop.png');
    await card01.screenshot({ path: outPath });
    console.log(`Saved: ${outPath}`);
  }

  await browser.close();
  console.log('Done');
  process.exit(0);
})();

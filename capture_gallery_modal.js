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
  console.log('Starting preview server on port 4329...');
  const server = spawn('npx', ['astro', 'preview', '--port', '4329'], {
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

  // Desktop viewport
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4329', { waitUntil: 'networkidle2' });

  // Scroll to gallery section
  await page.evaluate(() => {
    const el = document.getElementById('gallery');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 500));

  // Click card #3 (AKA-01 #1)
  console.log('Opening card 3 modal...');
  await page.evaluate(() => {
    const card = document.querySelector('[data-open-gallery-modal="3"]');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const desktopModalPath = path.join(ARTIFACT_DIR, 'gallery_modal_desktop_aka01_1.png');
  await page.screenshot({ path: desktopModalPath, fullPage: false });
  console.log('Saved desktop screenshot:', desktopModalPath);

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.getElementById('gallery-modal-close');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Mobile viewport
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });
  
  // Click card #5 (AKA-01 #2)
  console.log('Opening card 5 modal on mobile...');
  await page.evaluate(() => {
    const card = document.querySelector('[data-open-gallery-modal="5"]');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const mobileModalPath = path.join(ARTIFACT_DIR, 'gallery_modal_mobile_aka01_2.png');
  await page.screenshot({ path: mobileModalPath, fullPage: false });
  console.log('Saved mobile screenshot:', mobileModalPath);

  // Also test card #1 on desktop to be 100% sure
  await page.evaluate(() => {
    const closeBtn = document.getElementById('gallery-modal-close');
    if (closeBtn) closeBtn.click();
  });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    const card = document.querySelector('[data-open-gallery-modal="1"]');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const desktopCard1Path = path.join(ARTIFACT_DIR, 'gallery_modal_desktop_card1.png');
  await page.screenshot({ path: desktopCard1Path, fullPage: false });
  console.log('Saved card 1 desktop screenshot:', desktopCard1Path);

  await browser.close();
  server.kill();
  console.log('Done!');
  process.exit(0);
})();

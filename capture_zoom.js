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

const mode = process.argv[2] || 'after';

(async () => {
  const server = spawn('npx', ['astro', 'preview', '--port', '4335'], {
    shell: true,
    cwd: 'C:/Users/User/Desktop/lumivis lending'
  });

  await new Promise(r => setTimeout(r, 3500));

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true });
  await page.goto('http://localhost:4335', { waitUntil: 'networkidle2' });

  await page.evaluate(() => {
    document.querySelectorAll('.reveal, .reveal-hero, .reveal-left, .reveal-right, .reveal-up').forEach(el => {
      el.classList.add('active', 'animated');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
  });

  // Scroll to doctors grid
  await page.evaluate(() => {
    const docSec = document.getElementById('doctors');
    if (docSec) docSec.scrollIntoView({ block: 'start' });
  });
  await new Promise(r => setTimeout(r, 400));

  const card1Img = await page.$('.doctors__grid article:first-child .doctor-card__img');
  if (card1Img) {
    const box = await card1Img.boundingBox();
    if (box) {
      const outPath = path.join(ARTIFACT_DIR, `doctor_face_${mode}.png`);
      await page.screenshot({
        path: outPath,
        clip: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height * 0.65
        }
      });
      console.log(`Saved: ${outPath}`);
    }
  }

  await browser.close();
  server.kill();
  console.log(`Doctor 1 capture [${mode}] complete!`);
  process.exit(0);
})();

import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import fs from 'fs';

const EDGE_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\152.0.4191.66\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = EDGE_PATHS.find(p => fs.existsSync(p));

(async () => {
  const server = spawn('npx', ['astro', 'preview', '--port', '4342'], {
    shell: true,
    cwd: 'C:/Users/User/Desktop/lumivis lending'
  });

  await new Promise(r => setTimeout(r, 4000));

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const testWidths = [375, 393];

  for (const winWidth of testWidths) {
    console.log(`\n--- TESTING REAL CODEBASE AT ${winWidth}px VIEWPORT ---`);
    const page = await browser.newPage();
    await page.setViewport({ width: winWidth, height: 812, isMobile: true });
    await page.goto('http://localhost:4342', { waitUntil: 'networkidle2' });

    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const overflowResults = [];

    for (let y = 0; y <= pageHeight; y += 250) {
      await page.evaluate((scY) => window.scrollTo(0, scY), y);
      await new Promise(r => setTimeout(r, 50));

      const res = await page.evaluate((scY, targetW) => {
        const docW = document.documentElement.scrollWidth;
        const bodyW = document.body.scrollWidth;
        const isOverflowing = docW > targetW + 0.5 || bodyW > targetW + 0.5;
        return { y: scY, docW, bodyW, targetW, isOverflowing };
      }, y, winWidth);

      if (res.isOverflowing) {
        overflowResults.push(res);
      }
    }

    if (overflowResults.length === 0) {
      console.log(`[${winWidth}px] SUCCESS: 0 horizontal overflow! scrollWidth === ${winWidth}px across all ${pageHeight}px page scroll!`);
    } else {
      console.log(`[${winWidth}px] FAILED! Overflow found at ${overflowResults.length} scroll positions:`, overflowResults);
    }

    await page.close();
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();

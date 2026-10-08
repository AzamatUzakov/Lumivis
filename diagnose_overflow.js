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
  const port = 4357;
  const server = spawn('npx', ['astro', 'preview', '--port', String(port)], {
    shell: true,
    cwd: 'C:/Users/User/Desktop/lumivis lending'
  });

  await new Promise(r => setTimeout(r, 4000));

  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle2' });

    // Hide mobile menu offscreen element via CSS visibility
    await page.evaluate(() => {
      const menu = document.getElementById('mobile-menu');
      if (menu) {
        menu.style.visibility = 'hidden';
        menu.style.pointerEvents = 'none';
      }
    });

    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const overflowByScrollPosition = [];

    for (let y = 0; y <= pageHeight; y += 300) {
      await page.evaluate((scY) => window.scrollTo(0, scY), y);
      await new Promise(r => setTimeout(r, 50));

      const check = await page.evaluate((currentY) => {
        const winWidth = window.innerWidth;
        const docScrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;

        // Check if page itself has horizontal scrollbar
        const hasHorizontalScroll = docScrollWidth > winWidth + 1 || bodyScrollWidth > winWidth + 1;

        return {
          currentY,
          winWidth,
          docScrollWidth,
          bodyScrollWidth,
          hasHorizontalScroll
        };
      }, y);

      if (check.hasHorizontalScroll) {
        overflowByScrollPosition.push(check);
      }
    }

    console.log('=== PAGE OVERFLOW REPORT ===');
    console.log(`Page height: ${pageHeight}px`);
    console.log(`Positions with horizontal page scroll: ${overflowByScrollPosition.length}`);

    await browser.close();
  } catch (err) {
    console.error(err);
  } finally {
    server.kill();
  }
})();

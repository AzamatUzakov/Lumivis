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
  const server = spawn('npx', ['astro', 'preview', '--port', '4340'], {
    shell: true,
    cwd: 'C:/Users/User/Desktop/lumivis lending'
  });

  await new Promise(r => setTimeout(r, 4000));

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await page.goto('http://localhost:4340', { waitUntil: 'networkidle2' });

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
    await new Promise(r => setTimeout(r, 80));

    const check = await page.evaluate((currentY) => {
      const winWidth = window.innerWidth;
      const docScrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;

      const overflowingElements = [];
      document.querySelectorAll('*').forEach(el => {
        if (el.id === 'mobile-menu' || el.closest('#mobile-menu')) return;
        const rect = el.getBoundingClientRect();
        if (rect.right > winWidth + 1.5) {
          overflowingElements.push({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            right: rect.right,
            width: rect.width,
            snippet: el.outerHTML.substring(0, 100).replace(/\s+/g, ' ')
          });
        }
      });

      return {
        currentY,
        winWidth,
        docScrollWidth,
        bodyScrollWidth,
        overflowCount: overflowingElements.length,
        overflowingElements
      };
    }, y);

    if (check.docScrollWidth > 375 || check.bodyScrollWidth > 375 || check.overflowCount > 0) {
      overflowByScrollPosition.push(check);
    }
  }

  console.log('=== OVERFLOW REPORT (with mobile-menu hidden) ===');
  console.log(`Page Height: ${pageHeight}px`);
  console.log(`Positions with overflow: ${overflowByScrollPosition.length}`);

  overflowByScrollPosition.forEach(pos => {
    console.log(`\nScroll Y: ${pos.currentY}px | docScrollWidth: ${pos.docScrollWidth}px | bodyScrollWidth: ${pos.bodyScrollWidth}px | overflowing els: ${pos.overflowCount}`);
    pos.overflowingElements.forEach(el => {
      console.log(`   -> <${el.tag} id="${el.id}" class="${el.className}"> right=${el.right.toFixed(1)}px width=${el.width.toFixed(1)}px | ${el.snippet}`);
    });
  });

  await browser.close();
  server.kill();
  process.exit(0);
})();

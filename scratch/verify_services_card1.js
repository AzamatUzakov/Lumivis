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
  const port = 4391;
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

    const langs = ['ru', 'uz', 'en'];
    const widths = [375, 768, 1440];

    for (const lang of langs) {
      console.log(`\n================ LANG: /${lang}/ ================`);
      for (const w of widths) {
        const page = await browser.newPage();
        await page.setViewport({ width: w, height: 900, isMobile: w < 768 });
        await page.goto(`http://localhost:${port}/${lang}/`, { waitUntil: 'networkidle2' });

        await page.evaluate(() => {
          const menu = document.getElementById('mobile-menu');
          if (menu) {
            menu.style.visibility = 'hidden';
            menu.style.pointerEvents = 'none';
          }
        });

        // Check horizontal overflow
        const overflow = await page.evaluate((winWidth) => {
          const docW = document.documentElement.scrollWidth;
          const bodyW = document.body.scrollWidth;
          return docW > winWidth + 1 || bodyW > winWidth + 1;
        }, w);

        // Get card 01 elements info
        const info = await page.evaluate(() => {
          const titleEl = document.querySelector('.bento-rn-title');
          const badgeEl = document.querySelector('.bento-badge');
          const textEl = document.querySelector('.bento-rn-text');
          const btnEl = document.querySelector('.bento-rn-btn');
          const cardEl = document.querySelector('.bento-card--rn');

          if (!titleEl || !badgeEl || !textEl || !btnEl || !cardEl) return null;

          const titleRect = titleEl.getBoundingClientRect();
          const badgeRect = badgeEl.getBoundingClientRect();
          const textRect = textEl.getBoundingClientRect();
          const btnRect = btnEl.getBoundingClientRect();
          const cardRect = cardEl.getBoundingClientRect();

          // Calculate title line count using line-height
          const computedStyle = window.getComputedStyle(titleEl);
          const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.25;
          const titleLineCount = Math.round(titleRect.height / lineHeight);

          // Check overlap
          const badgeOverlap = titleRect.top < badgeRect.bottom;
          const textOverlap = titleRect.bottom > textRect.top;
          const btnOverlap = textRect.bottom > btnRect.top;

          return {
            titleText: titleEl.innerText.trim(),
            titleLineCount,
            titleHeight: Math.round(titleRect.height),
            lineHeight: Math.round(lineHeight),
            cardHeight: Math.round(cardRect.height),
            badgeOverlap,
            textOverlap,
            btnOverlap
          };
        });

        console.log(`Width ${w}px -> Overflow: ${overflow}`);
        console.log(`Title: "${info?.titleText}"`);
        console.log(`Lines: ${info?.titleLineCount} (${info?.titleHeight}px high, line-height ~${info?.lineHeight}px)`);
        console.log(`Card total height: ${info?.cardHeight}px`);
        console.log(`Overlaps -> Badge: ${info?.badgeOverlap}, Text: ${info?.textOverlap}, Button: ${info?.btnOverlap}`);

        await page.close();
      }
    }

    await browser.close();
  } catch (err) {
    console.error(err);
  } finally {
    server.kill();
  }
})();

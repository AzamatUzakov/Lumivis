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
  const port = 4392;
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

        const cardDetails = await page.evaluate(() => {
          // Card 02 (Diag)
          const card2 = document.querySelector('.bento-item--diag .bento-card');
          const title2 = card2?.querySelector('.bento-title');
          const desc2 = card2?.querySelector('.bento-text');

          // Card 04 (Amblyopia)
          const card4 = document.querySelector('.bento-item--amb .bento-card');
          const title4 = card4?.querySelector('.bento-title');
          const desc4 = card4?.querySelector('.bento-text');

          const getLineCount = (el) => {
            if (!el) return 0;
            const style = window.getComputedStyle(el);
            const lh = parseFloat(style.lineHeight) || (parseFloat(style.fontSize) * 1.35);
            return Math.round(el.getBoundingClientRect().height / lh);
          };

          return {
            c2Title: title2 ? title2.innerText.trim() : '',
            c2Desc: desc2 ? desc2.innerText.trim() : '',
            c2DescLines: getLineCount(desc2),
            c2Height: Math.round(card2?.getBoundingClientRect().height || 0),

            c4Title: title4 ? title4.innerText.trim() : '',
            c4TitleLines: getLineCount(title4),
            c4Desc: desc4 ? desc4.innerText.trim() : '',
            c4Height: Math.round(card4?.getBoundingClientRect().height || 0)
          };
        });

        console.log(`Width ${w}px -> Overflow: ${overflow}`);
        console.log(`Card 02 (Diag): desc="${cardDetails.c2Desc}" | descLines=${cardDetails.c2DescLines} | cardHeight=${cardDetails.c2Height}px`);
        console.log(`Card 04 (Amb): title="${cardDetails.c4Title}" | titleLines=${cardDetails.c4TitleLines} | cardHeight=${cardDetails.c4Height}px`);

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

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
  const port = 4390;
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

        // Get equipment card 10 text & card dimensions
        const equipCardInfo = await page.evaluate(() => {
          const cells = Array.from(document.querySelectorAll('.equip-cell'));
          return cells.map((cell, idx) => {
            const nameEl = cell.querySelector('.equip-cell__name');
            const descEl = cell.querySelector('.equip-cell__desc');
            const rect = cell.getBoundingClientRect();
            return {
              id: idx + 1,
              name: nameEl ? nameEl.innerText.trim() : '',
              desc: descEl ? descEl.innerText.trim() : '',
              height: Math.round(rect.height),
              width: Math.round(rect.width)
            };
          });
        });

        console.log(`Width ${w}px -> Overflow: ${overflow}`);
        console.log(`Card 10 (${equipCardInfo[9]?.name}): "${equipCardInfo[9]?.desc}"`);
        console.log(`Card heights:`, equipCardInfo.map(c => `Card ${c.id}: ${c.height}px`).join(', '));

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

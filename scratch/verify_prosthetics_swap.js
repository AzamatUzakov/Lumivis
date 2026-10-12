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
  const port = 4393;
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

        // Check horizontal page overflow
        const overflow = await page.evaluate((winWidth) => {
          const docW = document.documentElement.scrollWidth;
          const bodyW = document.body.scrollWidth;
          return docW > winWidth + 1 || bodyW > winWidth + 1;
        }, w);

        const casesInfo = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('.prosthetics-card')).slice(0, 7);
          return cards.map((c, i) => {
            const title = c.querySelector('.prosthetics-card__title')?.innerText.trim();
            const imgs = Array.from(c.querySelectorAll('.prosthetics-media__img')).map(img => {
              const src = img.getAttribute('src') || '';
              // Extract asset name from hash URL e.g. case4_before...
              const match = src.match(/(case\d_[a-z]+)/);
              return match ? match[1] : src;
            });
            const rect = c.getBoundingClientRect();
            return {
              id: i + 1,
              title,
              imgs,
              height: Math.round(rect.height)
            };
          });
        });

        console.log(`Width ${w}px -> Overflow: ${overflow}`);
        casesInfo.forEach(c => {
          console.log(`  Case ${c.id} ("${c.title}"): imgs=[${c.imgs.join(', ')}], height=${c.height}px`);
        });

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
